/**
 * 24_Especialidades.js — Dominio Especialidades y Subespecialidades (fase 4).
 * Catálogo CONFIGURABLE (semilla: 3 OFICIALES + internas) + asignación N:N
 * a voluntarios (Voluntario Especialidades), con nivel y credencial opcional.
 * API:
 *   listarEspecialidadesV2 / listarSubespecialidadesV2
 *   crearEspecialidadV2 / actualizarEspecialidadV2
 *   crearSubespecialidadV2 / actualizarSubespecialidadV2
 *   asignarEspecialidadV2(voluntarioId, datos) / quitarEspecialidadV2(id)
 *   listarEspecialidadesVoluntarioV2(voluntarioId)
 */

function listarEspecialidadesV2() {
  try {
    var ss = _ss();
    var esp = _tablaV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD);
    var areas = _tablaV2(ss, HOJA_V2.areas, COL_AREA, N_COLS_AREA);
    var porArea = {};
    for (var a = 0; a < areas.length; a++) porArea[String(areas[a].id)] = areas[a];
    var res = esp.map(function (e) {
      var area = e.areaId ? porArea[String(e.areaId)] : null;
      return { id: e.id, nombre: String(e.nombre || ''), areaId: e.areaId ? String(e.areaId) : '', area: area ? area.nombre : '', descripcion: String(e.descripcion || ''), origen: String(e.origen || ''), activo: _bool(e.activo, true), niveles: _listaNivelesV2(e.niveles).join('; ') };
    }).sort(function (a, b) { return _norm(a.nombre).localeCompare(_norm(b.nombre)); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function listarSubespecialidadesV2() {
  try {
    var ss = _ss();
    var sub = _tablaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD);
    var esp = _tablaV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD);
    var porEsp = {};
    for (var e = 0; e < esp.length; e++) porEsp[String(esp[e].id)] = esp[e];
    var res = sub.map(function (s) {
      var p = s.especialidadId ? porEsp[String(s.especialidadId)] : null;
      return { id: s.id, especialidadId: s.especialidadId ? String(s.especialidadId) : '', especialidad: p ? p.nombre : '', nombre: String(s.nombre || ''), descripcion: String(s.descripcion || ''), origen: String(s.origen || ''), activo: _bool(s.activo, true), niveles: _listaNivelesV2(s.niveles).join('; ') };
    }).sort(function (a, b) { return _norm(a.nombre).localeCompare(_norm(b.nombre)); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function crearEspecialidadV2(datos) {
  datos = datos || {};
  var ss = _ss();
  var nombre = _titulo(datos.nombre);
  if (!nombre) return _resErr('DATOS_INCOMPLETOS', 'Nombre de la especialidad: obligatorio');
  var existentes = _tablaV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD);
  for (var i = 0; i < existentes.length; i++) {
    if (_norm(existentes[i].nombre) === _norm(nombre)) return _resErr('DUPLICADO', 'La especialidad "' + nombre + '" ya existe');
  }
  var fila = {};
  fila[COL_ESPECIALIDAD.nombre] = nombre;
  fila[COL_ESPECIALIDAD.areaId] = _texto(datos.areaId);
  fila[COL_ESPECIALIDAD.descripcion] = _texto(datos.descripcion);
  fila[COL_ESPECIALIDAD.origen] = 'INTERNO';
  fila[COL_ESPECIALIDAD.activo] = true;
  fila[COL_ESPECIALIDAD.niveles] = _textoNivelesV2(datos.niveles);
  var res = _insertarFilaV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, fila);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.especialidades, 'crearEspecialidadV2', 'OK', res.data.id + ' — ' + nombre);
  return _resOk({ id: res.data.id });
}

function actualizarEspecialidadV2(id, cambios) {
  cambios = cambios || {};
  var ss = _ss();
  var aplicar = {};
  if (cambios.nombre !== undefined) {
    var nombre = _titulo(cambios.nombre);
    if (!nombre) return _resErr('DATOS_INCOMPLETOS', 'Nombre: obligatorio');
    aplicar[COL_ESPECIALIDAD.nombre] = nombre;
  }
  if (cambios.areaId !== undefined) aplicar[COL_ESPECIALIDAD.areaId] = _texto(cambios.areaId);
  if (cambios.descripcion !== undefined) aplicar[COL_ESPECIALIDAD.descripcion] = _texto(cambios.descripcion);
  if (cambios.niveles !== undefined) aplicar[COL_ESPECIALIDAD.niveles] = _textoNivelesV2(cambios.niveles);
  if (cambios.activo !== undefined) aplicar[COL_ESPECIALIDAD.activo] = _bool(cambios.activo, true);
  var res = _actualizarFilaV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, id, aplicar);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.especialidades, 'actualizarEspecialidadV2', 'OK', id);
  return _resOk({ id: id });
}

function crearSubespecialidadV2(datos) {
  datos = datos || {};
  var ss = _ss();
  var nombre = _titulo(datos.nombre);
  if (!nombre) return _resErr('DATOS_INCOMPLETOS', 'Nombre de la subespecialidad: obligatorio');
  if (!_texto(datos.especialidadId)) return _resErr('DATOS_INCOMPLETOS', 'Especialidad: obligatoria');
  var existentes = _tablaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD);
  for (var i = 0; i < existentes.length; i++) {
    if (String(existentes[i].especialidadId) === _texto(datos.especialidadId) && _norm(existentes[i].nombre) === _norm(nombre)) {
      return _resErr('DUPLICADO', 'La subespecialidad "' + nombre + '" ya existe para esa especialidad');
    }
  }
  var fila = {};
  fila[COL_SUBESPECIALIDAD.especialidadId] = _texto(datos.especialidadId);
  fila[COL_SUBESPECIALIDAD.nombre] = nombre;
  fila[COL_SUBESPECIALIDAD.descripcion] = _texto(datos.descripcion);
  fila[COL_SUBESPECIALIDAD.origen] = 'INTERNO';
  fila[COL_SUBESPECIALIDAD.activo] = true;
  fila[COL_SUBESPECIALIDAD.niveles] = _textoNivelesV2(datos.niveles);
  var res = _insertarFilaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD, fila);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.subespecialidades, 'crearSubespecialidadV2', 'OK', res.data.id + ' — ' + nombre);
  return _resOk({ id: res.data.id });
}

function actualizarSubespecialidadV2(id, cambios) {
  cambios = cambios || {};
  var ss = _ss();
  var aplicar = {};
  if (cambios.nombre !== undefined) {
    var nombre = _titulo(cambios.nombre);
    if (!nombre) return _resErr('DATOS_INCOMPLETOS', 'Nombre: obligatorio');
    aplicar[COL_SUBESPECIALIDAD.nombre] = nombre;
  }
  if (cambios.especialidadId !== undefined) aplicar[COL_SUBESPECIALIDAD.especialidadId] = _texto(cambios.especialidadId);
  if (cambios.descripcion !== undefined) aplicar[COL_SUBESPECIALIDAD.descripcion] = _texto(cambios.descripcion);
  if (cambios.niveles !== undefined) aplicar[COL_SUBESPECIALIDAD.niveles] = _textoNivelesV2(cambios.niveles);
  if (cambios.activo !== undefined) aplicar[COL_SUBESPECIALIDAD.activo] = _bool(cambios.activo, true);
  var res = _actualizarFilaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD, id, aplicar);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.subespecialidades, 'actualizarSubespecialidadV2', 'OK', id);
  return _resOk({ id: id });
}

/**
 * Asigna una especialidad (o subespecialidad) a un voluntario.
 * datos: {especialidadId?, subespecialidadId?, nivel?, fechaAsignacion?, credencialId?, observaciones?}
 * Regla: al menos una de especialidadId/subespecialidadId debe existir.
 */
function asignarEspecialidadV2(voluntarioId, datos) {
  datos = datos || {};
  var ss = _ss();
  var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
    return String(v.id) === String(voluntarioId);
  });
  if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario ' + voluntarioId + ' no existe');
  var espId = _texto(datos.especialidadId);
  var subId = _texto(datos.subespecialidadId);
  if (!espId && !subId) return _resErr('DATOS_INCOMPLETOS', 'Indica especialidad o subespecialidad');
  if (espId && subId) {
    var sub = _buscarV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD, function (s) {
      return String(s.id) === subId;
    });
    if (sub && String(sub.especialidadId || '') !== espId) {
      return _resErr('VALIDACION', 'La subespecialidad no pertenece a la especialidad indicada');
    }
  }
  var fecha = _texto(datos.fechaAsignacion) ? _parseDate(datos.fechaAsignacion) : new Date();
  if (!fecha) return _resErr('VALIDACION', 'Fecha de asignación inválida');

  var fila = {};
  fila[COL_VOL_ESPECIALIDAD.voluntarioId] = voluntarioId;
  fila[COL_VOL_ESPECIALIDAD.especialidadId] = espId;
  fila[COL_VOL_ESPECIALIDAD.subespecialidadId] = subId;
  fila[COL_VOL_ESPECIALIDAD.fechaAsignacion] = fecha;
  fila[COL_VOL_ESPECIALIDAD.nivel] = _texto(datos.nivel);
  fila[COL_VOL_ESPECIALIDAD.credencialId] = _texto(datos.credencialId);
  fila[COL_VOL_ESPECIALIDAD.observaciones] = _texto(datos.observaciones);
  var res = _insertarFilaV2(ss, HOJA_V2.voluntarioEspecialidades, COL_VOL_ESPECIALIDAD, N_COLS_VOL_ESPECIALIDAD, fila);
  if (!res.ok) return res;
  var nombre = subId ? 'subespecialidad' : 'especialidad';
  _agregarEventoHojaV2(ss, voluntarioId, 'ESPECIALIDAD', _fmtFecha(fecha), 'Asignación de ' + nombre + ' (ref. ' + (subId || espId) + ')', String(res.data.id));
  _log(ss, HOJA_V2.voluntarioEspecialidades, 'asignarEspecialidadV2', 'OK', 'Vol. ' + voluntarioId + ' ref ' + (subId || espId));
  return _resOk({ id: res.data.id });
}

/**
 * Cierra lógicamente una asignación de especialidad (V3.3): NO elimina la fila;
 * conserva especialidadId/subespecialidadId/nivel/credencialId/fechas originales
 * y la marca como no vigente (activo=false). Consultable vía incluirCerradas.
 * datos: {motivo?} — opcional y compatible con la firma previa (id).
 */
function quitarEspecialidadV2(id, datos) {
  var ss = _ss();
  var res = _cerrarFilaV2(ss, HOJA_V2.voluntarioEspecialidades, COL_VOL_ESPECIALIDAD, N_COLS_VOL_ESPECIALIDAD, id, datos || {}, 'activo', false, 'Cierre (V3.3)');
  if (!res.ok) return res;
  var registro = res.data.registro;
  if (!res.data.yaCerrado && registro && registro.voluntarioId) {
    var ref = registro.especialidadId || registro.subespecialidadId || '';
    _agregarEventoHojaV2(ss, String(registro.voluntarioId), 'ESPECIALIDAD', _fmtFecha(new Date()), 'Cierre de relación (ref. ' + ref + ')', String(id));
  }
  _log(ss, HOJA_V2.voluntarioEspecialidades, 'quitarEspecialidadV2', 'OK', id + (res.data.yaCerrado ? ' (ya cerrada)' : ''));
  return res;
}

/**
 * Lista asignaciones de especialidad de un voluntario (V3.3): por defecto solo
 * las vigentes; con opciones.incluirCerradas=true incluye las cerradas
 * (activo=false), marcadas con activo:false para el historial.
 */
function listarEspecialidadesVoluntarioV2(voluntarioId, opciones) {
  try {
    var ss = _ss();
    var incluirCerradas = !!(opciones && opciones.incluirCerradas);
    var filas = _tablaV2(ss, HOJA_V2.voluntarioEspecialidades, COL_VOL_ESPECIALIDAD, N_COLS_VOL_ESPECIALIDAD).filter(function (v) {
      if (String(v.voluntarioId) !== String(voluntarioId)) return false;
      return incluirCerradas || _vigenteV2(v.activo);
    });
    var esp = _tablaV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD);
    var sub = _tablaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD);
    var cred = _tablaV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL);
    var porEsp = {}, porSub = {}, porCred = {};
    for (var e = 0; e < esp.length; e++) porEsp[String(esp[e].id)] = esp[e];
    for (var s = 0; s < sub.length; s++) porSub[String(sub[s].id)] = sub[s];
    for (var c = 0; c < cred.length; c++) porCred[String(cred[c].id)] = cred[c];
    var res = filas.map(function (f) {
      var e = f.especialidadId ? porEsp[String(f.especialidadId)] : null;
      var s = f.subespecialidadId ? porSub[String(f.subespecialidadId)] : null;
      var c = f.credencialId ? porCred[String(f.credencialId)] : null;
      return {
        id: f.id,
        especialidad: e ? e.nombre : '',
        especialidadId: f.especialidadId ? String(f.especialidadId) : '',
        subespecialidad: s ? s.nombre : '',
        subespecialidadId: f.subespecialidadId ? String(f.subespecialidadId) : '',
        nombre: (e ? e.nombre : '') + (s ? ' → ' + s.nombre : ''),
        nivel: String(f.nivel || ''),
        fechaAsignacion: _fechaV2(f.fechaAsignacion),
        credencialId: f.credencialId ? String(f.credencialId) : '',
        credencial: c ? c.nombre : '',
        observaciones: String(f.observaciones || ''),
        activo: _vigenteV2(f.activo)
      };
    }).sort(function (a, b) { return _norm(a.nombre).localeCompare(_norm(b.nombre)); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}