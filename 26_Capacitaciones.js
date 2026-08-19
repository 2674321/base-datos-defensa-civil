/**
 * 26_Capacitaciones.js — Dominio Capacitaciones (fase 4).
 * Catálogo de cursos (internas/externas) + asignación N:N con aprobación,
 * calificación y vencimiento derivado de la vigencia (meses) del curso.
 * API:
 *   listarCapacitacionesV2 / crearCapacitacionV2 / actualizarCapacitacionV2
 *   asignarCapacitacionV2(voluntarioId, capacitacionId, datos)
 *   quitarCapacitacionV2(id)
 *   listarCapacitacionesVoluntarioV2(voluntarioId)
 *   obtenerCapacitacionesVencidasV2()
 */

function listarCapacitacionesV2() {
  try {
    var ss = _ss();
    var cap = _tablaV2(ss, HOJA_V2.capacitaciones, COL_CAPACITACION, N_COLS_CAPACITACION);
    var res = cap.map(function (c) {
      return {
        id: c.id,
        nombre: String(c.nombre || ''),
        institucion: String(c.institucion || ''),
        instructor: String(c.instructor || ''),
        tipo: String(c.tipo || ''),
        horas: Number(c.horas || 0),
        vigenciaMeses: Number(c.vigenciaMeses || 0),
        origen: String(c.origen || ''),
        activo: _bool(c.activo, true),
        observaciones: String(c.observaciones || '')
      };
    }).sort(function (a, b) { return _norm(a.nombre).localeCompare(_norm(b.nombre)); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function crearCapacitacionV2(datos) {
  datos = datos || {};
  var ss = _ss();
  var nombre = _titulo(datos.nombre);
  if (!nombre) return _resErr('DATOS_INCOMPLETOS', 'Nombre de la capacitación: obligatorio');
  var existentes = _tablaV2(ss, HOJA_V2.capacitaciones, COL_CAPACITACION, N_COLS_CAPACITACION);
  for (var i = 0; i < existentes.length; i++) {
    if (_norm(existentes[i].nombre) === _norm(nombre)) return _resErr('DUPLICADO', 'La capacitación "' + nombre + '" ya existe');
  }
  var fila = {};
  fila[COL_CAPACITACION.nombre] = nombre;
  fila[COL_CAPACITACION.institucion] = _texto(datos.institucion);
  fila[COL_CAPACITACION.instructor] = _texto(datos.instructor);
  fila[COL_CAPACITACION.tipo] = _texto(datos.tipo) || 'Interna';
  fila[COL_CAPACITACION.horas] = Number(datos.horas || 0);
  fila[COL_CAPACITACION.vigenciaMeses] = Number(datos.vigenciaMeses || 0);
  fila[COL_CAPACITACION.origen] = 'INTERNO';
  fila[COL_CAPACITACION.activo] = true;
  fila[COL_CAPACITACION.observaciones] = _texto(datos.observaciones);
  var res = _insertarFilaV2(ss, HOJA_V2.capacitaciones, COL_CAPACITACION, N_COLS_CAPACITACION, fila);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.capacitaciones, 'crearCapacitacionV2', 'OK', res.data.id + ' — ' + nombre);
  return _resOk({ id: res.data.id });
}

function actualizarCapacitacionV2(id, cambios) {
  cambios = cambios || {};
  var ss = _ss();
  var aplicar = {};
  if (cambios.nombre !== undefined) {
    var nombre = _titulo(cambios.nombre);
    if (!nombre) return _resErr('DATOS_INCOMPLETOS', 'Nombre: obligatorio');
    aplicar[COL_CAPACITACION.nombre] = nombre;
  }
  if (cambios.institucion !== undefined) aplicar[COL_CAPACITACION.institucion] = _texto(cambios.institucion);
  if (cambios.instructor !== undefined) aplicar[COL_CAPACITACION.instructor] = _texto(cambios.instructor);
  if (cambios.tipo !== undefined) aplicar[COL_CAPACITACION.tipo] = _texto(cambios.tipo);
  if (cambios.horas !== undefined) aplicar[COL_CAPACITACION.horas] = Number(cambios.horas || 0);
  if (cambios.vigenciaMeses !== undefined) aplicar[COL_CAPACITACION.vigenciaMeses] = Number(cambios.vigenciaMeses || 0);
  if (cambios.activo !== undefined) aplicar[COL_CAPACITACION.activo] = _bool(cambios.activo, true);
  if (cambios.observaciones !== undefined) aplicar[COL_CAPACITACION.observaciones] = _texto(cambios.observaciones);
  var res = _actualizarFilaV2(ss, HOJA_V2.capacitaciones, COL_CAPACITACION, N_COLS_CAPACITACION, id, aplicar);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.capacitaciones, 'actualizarCapacitacionV2', 'OK', id);
  return _resOk({ id: id });
}

/** Asigna una capacitación a un voluntario; fechaVencimiento derivada de vigenciaMeses. */
function asignarCapacitacionV2(voluntarioId, capacitacionId, datos) {
  datos = datos || {};
  var ss = _ss();
  var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
    return String(v.id) === String(voluntarioId);
  });
  if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario ' + voluntarioId + ' no existe');
  var cap = _buscarV2(ss, HOJA_V2.capacitaciones, COL_CAPACITACION, N_COLS_CAPACITACION, function (c) {
    return String(c.id) === String(capacitacionId);
  });
  if (!cap) return _resErr('NO_ENCONTRADO', 'Capacitación ' + capacitacionId + ' no existe');
  var fecha = _texto(datos.fecha) ? _parseDate(datos.fecha) : new Date();
  if (!fecha) return _resErr('VALIDACION', 'Fecha inválida');
  var vigenciaMeses = Number(cap.vigenciaMeses || 0);
  var fechaVenc = null;
  if (vigenciaMeses > 0) {
    fechaVenc = new Date(fecha);
    fechaVenc.setMonth(fechaVenc.getMonth() + vigenciaMeses);
  }
  var fila = {};
  fila[COL_VOL_CAPACITACION.voluntarioId] = voluntarioId;
  fila[COL_VOL_CAPACITACION.capacitacionId] = capacitacionId;
  fila[COL_VOL_CAPACITACION.fecha] = fecha;
  fila[COL_VOL_CAPACITACION.fechaVencimiento] = fechaVenc;
  fila[COL_VOL_CAPACITACION.aprobado] = _bool(datos.aprobado, false);
  fila[COL_VOL_CAPACITACION.calificacion] = _texto(datos.calificacion);
  fila[COL_VOL_CAPACITACION.respaldo] = _texto(datos.respaldo);
  fila[COL_VOL_CAPACITACION.observaciones] = _texto(datos.observaciones);
  var res = _insertarFilaV2(ss, HOJA_V2.voluntarioCapacitaciones, COL_VOL_CAPACITACION, N_COLS_VOL_CAPACITACION, fila);
  if (!res.ok) return res;
  _agregarEventoHojaV2(ss, voluntarioId, 'CAPACITACION', _fmtFecha(fecha), 'Capacitación: ' + cap.nombre + (_bool(datos.aprobado, false) ? ' (aprobada)' : ''), String(res.data.id));
  _log(ss, HOJA_V2.voluntarioCapacitaciones, 'asignarCapacitacionV2', 'OK', 'Vol. ' + voluntarioId + ' → ' + cap.nombre);
  return _resOk({ id: res.data.id });
}

/**
 * Cierra lógicamente una capacitación asignada (V3.3): NO elimina la fila;
 * conserva la relación (fechas/aprobado/calificación) y la marca activo=false.
 * No aparece en la lista vigente ni en vencidas; consultable con incluirCerradas.
 * datos: {motivo?} — opcional y compatible con la firma previa (id).
 */
function quitarCapacitacionV2(id, datos) {
  var ss = _ss();
  var res = _cerrarFilaV2(ss, HOJA_V2.voluntarioCapacitaciones, COL_VOL_CAPACITACION, N_COLS_VOL_CAPACITACION, id, datos || {}, 'activo', false, 'Cierre (V3.3)');
  if (!res.ok) return res;
  var registro = res.data.registro;
  if (!res.data.yaCerrado && registro && registro.voluntarioId) {
    _agregarEventoHojaV2(ss, String(registro.voluntarioId), 'CAPACITACION', _fmtFecha(new Date()), 'Cierre de relación (ref. ' + (registro.capacitacionId || '') + ')', String(id));
  }
  _log(ss, HOJA_V2.voluntarioCapacitaciones, 'quitarCapacitacionV2', 'OK', id + (res.data.yaCerrado ? ' (ya cerrada)' : ''));
  return res;
}

/**
 * Lista capacitaciones de un voluntario (V3.3): vigentes por defecto; con
 * opciones.incluirCerradas=true incluye las cerradas (activo:false).
 */
function listarCapacitacionesVoluntarioV2(voluntarioId, opciones) {
  try {
    var ss = _ss();
    var incluirCerradas = !!(opciones && opciones.incluirCerradas);
    var filas = _tablaV2(ss, HOJA_V2.voluntarioCapacitaciones, COL_VOL_CAPACITACION, N_COLS_VOL_CAPACITACION).filter(function (v) {
      if (String(v.voluntarioId) !== String(voluntarioId)) return false;
      return incluirCerradas || _vigenteV2(v.activo);
    });
    var cap = _tablaV2(ss, HOJA_V2.capacitaciones, COL_CAPACITACION, N_COLS_CAPACITACION);
    var porId = {};
    for (var c = 0; c < cap.length; c++) porId[String(cap[c].id)] = cap[c];
    var res = filas.map(function (f) {
      var c = porId[String(f.capacitacionId)];
      return {
        id: f.id,
        capacitacionId: String(f.capacitacionId || ''),
        nombre: c ? c.nombre : String(f.capacitacionId),
        institucion: c ? String(c.institucion || '') : '',
        fecha: _fechaV2(f.fecha),
        fechaVencimiento: _fechaV2(f.fechaVencimiento),
        aprobado: _bool(f.aprobado, false),
        calificacion: String(f.calificacion || ''),
        respaldo: String(f.respaldo || ''),
        observaciones: String(f.observaciones || ''),
        activo: _vigenteV2(f.activo)
      };
    }).sort(function (a, b) { return _parseDate(a.fecha || '01/01/2000') - _parseDate(b.fecha || '01/01/2000'); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

/** Capacitaciones asignadas vencidas o por vencer (alertas y reportes). */
function obtenerCapacitacionesVencidasV2() {
  try {
    var ss = _ss();
    var filas = _tablaV2(ss, HOJA_V2.voluntarioCapacitaciones, COL_VOL_CAPACITACION, N_COLS_VOL_CAPACITACION);
    var cap = _tablaV2(ss, HOJA_V2.capacitaciones, COL_CAPACITACION, N_COLS_CAPACITACION);
    var voluntarios = _tablaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2);
    var personas = _tablaV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA);
    var porCap = {};
    for (var c = 0; c < cap.length; c++) porCap[String(cap[c].id)] = cap[c];
    var nombrePorVol = {};
    for (var v = 0; v < voluntarios.length; v++) {
      var p = null;
      for (var x = 0; x < personas.length; x++) {
        if (String(personas[x].id) === String(voluntarios[v].personaId)) { p = personas[x]; break; }
      }
      nombrePorVol[String(voluntarios[v].id)] = p ? [p.nombres, p.apPaterno, p.apMaterno].filter(function (s) { return String(s).trim(); }).join(' ') : '';
    }
    var hoy = new Date();
    var res = [];
    for (var i = 0; i < filas.length; i++) {
      var f = filas[i];
      if (!_vigenteV2(f.activo)) continue;
      var venc = _parseDate(f.fechaVencimiento);
      if (!venc) continue;
      if (venc.getTime() >= hoy.getTime()) continue;
      var c2 = porCap[String(f.capacitacionId)];
      res.push({
        voluntarioId: String(f.voluntarioId || ''),
        voluntario: nombrePorVol[String(f.voluntarioId)] || '—',
        capacitacion: c2 ? c2.nombre : String(f.capacitacionId),
        fecha: _fechaV2(f.fecha),
        fechaVencimiento: _fechaV2(f.fechaVencimiento)
      });
    }
    res.sort(function (a, b) { return _parseDate(a.fechaVencimiento || '01/01/2100') - _parseDate(b.fechaVencimiento || '01/01/2100'); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}