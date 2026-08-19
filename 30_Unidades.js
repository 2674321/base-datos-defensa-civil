/**
 * 30_Unidades.js — Dominio Unidades Internas (fase 8).
 * Estructura orgánica interna de la sede. La Unidad Interna "Fuerza de Tarea Delta"
 * responde a la Ley de Reclutamiento — con colisión documentada con el Código Delta
 * (OFICIAL): se distinguen alfa (Unidad Interna) y numérico (Código Delta).
 * El rol de los integrantes dentro de la unidad NO es el cargo institucional.
 * API:
 *   listarUnidadesV2 / crearUnidadV2 / actualizarUnidadV2
 *   listarIntegrantesUnidadV2(unidadId) / asignarIntegranteUnidadV2 / egresarIntegranteUnidadV2
 */

function listarUnidadesV2() {
  try {
    var ss = _ss();
    var filas = _tablaV2(ss, HOJA_V2.unidadesInternas, COL_UNIDAD, N_COLS_UNIDAD);
    var integrantes = _tablaV2(ss, HOJA_V2.integrantesUnidad, COL_INTEGRANTE_UNIDAD, N_COLS_INTEGRANTE_UNIDAD);
    var porUnidad = {};
    for (var i = 0; i < integrantes.length; i++) {
      if (integrantes[i].fechaSalida) continue;
      var uid = String(integrantes[i].unidadId || '');
      porUnidad[uid] = (porUnidad[uid] || 0) + 1;
    }
    var res = filas.map(function (f) {
      return {
        id: f.id,
        nombre: String(f.nombre || ''),
        descripcion: String(f.descripcion || ''),
        estado: String(f.estado || 'Activa'),
        jefeId: String(f.jefeId || ''),
        fechaCreacion: _fechaV2(f.fechaCreacion),
        integrantes: porUnidad[String(f.id)] || 0,
        observaciones: String(f.observaciones || '')
      };
    }).sort(function (a, b) { return _norm(a.nombre).localeCompare(_norm(b.nombre)); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function crearUnidadV2(datos) {
  datos = datos || {};
  var ss = _ss();
  var nombre = _titulo(datos.nombre);
  if (!nombre) return _resErr('DATOS_INCOMPLETOS', 'Nombre de la unidad: obligatorio');
  var existentes = _tablaV2(ss, HOJA_V2.unidadesInternas, COL_UNIDAD, N_COLS_UNIDAD);
  for (var i = 0; i < existentes.length; i++) {
    if (_norm(existentes[i].nombre) === _norm(nombre)) return _resErr('DUPLICADO', 'La unidad "' + nombre + '" ya existe');
  }
  var estado = _texto(datos.estado) || 'Activa';
  if (ESTADOS_UNIDAD.indexOf(estado) === -1) return _resErr('VALIDACION', 'Estado debe ser: ' + ESTADOS_UNIDAD.join(', '));
  var fila = {};
  fila[COL_UNIDAD.nombre] = nombre;
  fila[COL_UNIDAD.descripcion] = _texto(datos.descripcion);
  fila[COL_UNIDAD.estado] = estado;
  fila[COL_UNIDAD.jefeId] = _texto(datos.jefeId);
  fila[COL_UNIDAD.fechaCreacion] = _texto(datos.fechaCreacion) ? _parseDate(datos.fechaCreacion) : new Date();
  fila[COL_UNIDAD.observaciones] = _texto(datos.observaciones);
  var res = _insertarFilaV2(ss, HOJA_V2.unidadesInternas, COL_UNIDAD, N_COLS_UNIDAD, fila);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.unidadesInternas, 'crearUnidadV2', 'OK', res.data.id + ' — ' + nombre);
  return _resOk({ id: res.data.id });
}

function actualizarUnidadV2(id, cambios) {
  cambios = cambios || {};
  var ss = _ss();
  var aplicar = {};
  var errores = [];
  if (cambios.nombre !== undefined) {
    var nombre = _titulo(cambios.nombre);
    if (!nombre) errores.push('Nombre: obligatorio');
    else aplicar[COL_UNIDAD.nombre] = nombre;
  }
  if (cambios.estado !== undefined) {
    var estado = _texto(cambios.estado);
    if (ESTADOS_UNIDAD.indexOf(estado) === -1) errores.push('Estado debe ser: ' + ESTADOS_UNIDAD.join(', '));
    else aplicar[COL_UNIDAD.estado] = estado;
  }
  if (errores.length) return _resErr('VALIDACION', errores.join('\n'));
  if (cambios.descripcion !== undefined) aplicar[COL_UNIDAD.descripcion] = _texto(cambios.descripcion);
  if (cambios.jefeId !== undefined) aplicar[COL_UNIDAD.jefeId] = _texto(cambios.jefeId);
  if (cambios.observaciones !== undefined) aplicar[COL_UNIDAD.observaciones] = _texto(cambios.observaciones);
  var res = _actualizarFilaV2(ss, HOJA_V2.unidadesInternas, COL_UNIDAD, N_COLS_UNIDAD, id, aplicar);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.unidadesInternas, 'actualizarUnidadV2', 'OK', id);
  return _resOk({ id: id });
}

function listarIntegrantesUnidadV2(unidadId) {
  try {
    var ss = _ss();
    var filas = _tablaV2(ss, HOJA_V2.integrantesUnidad, COL_INTEGRANTE_UNIDAD, N_COLS_INTEGRANTE_UNIDAD).filter(function (i) {
      return String(i.unidadId) === String(unidadId);
    });
    var voluntarios = _tablaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2);
    var personas = _tablaV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA);
    var porPersona = {};
    for (var p = 0; p < personas.length; p++) porPersona[String(personas[p].id)] = personas[p];
    var nombrePorVol = {};
    for (var v = 0; v < voluntarios.length; v++) {
      var pe = porPersona[String(voluntarios[v].personaId)];
      nombrePorVol[String(voluntarios[v].id)] = pe ? [pe.nombres, pe.apPaterno, pe.apMaterno].filter(function (s) { return String(s).trim(); }).join(' ') : '';
    }
    var res = filas.map(function (f) {
      return {
        id: f.id,
        voluntarioId: String(f.voluntarioId || ''),
        voluntario: nombrePorVol[String(f.voluntarioId)] || '—',
        rol: String(f.rol || ''),
        fechaIngreso: _fechaV2(f.fechaIngreso),
        fechaSalida: _fechaV2(f.fechaSalida),
        activo: !f.fechaSalida,
        observaciones: String(f.observaciones || '')
      };
    });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function asignarIntegranteUnidadV2(unidadId, voluntarioId, datos) {
  datos = datos || {};
  var ss = _ss();
  var unidad = _buscarV2(ss, HOJA_V2.unidadesInternas, COL_UNIDAD, N_COLS_UNIDAD, function (u) {
    return String(u.id) === String(unidadId);
  });
  if (!unidad) return _resErr('NO_ENCONTRADO', 'Unidad ' + unidadId + ' no existe');
  var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
    return String(v.id) === String(voluntarioId);
  });
  if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario ' + voluntarioId + ' no existe');
  var existentes = _tablaV2(ss, HOJA_V2.integrantesUnidad, COL_INTEGRANTE_UNIDAD, N_COLS_INTEGRANTE_UNIDAD);
  for (var i = 0; i < existentes.length; i++) {
    if (String(existentes[i].unidadId) === String(unidadId) && String(existentes[i].voluntarioId) === String(voluntarioId) && !existentes[i].fechaSalida) {
      return _resErr('DUPLICADO', 'El voluntario ya es integrante activo de esta unidad');
    }
  }
  var fila = {};
  fila[COL_INTEGRANTE_UNIDAD.unidadId] = unidadId;
  fila[COL_INTEGRANTE_UNIDAD.voluntarioId] = voluntarioId;
  fila[COL_INTEGRANTE_UNIDAD.rol] = _texto(datos.rol);
  fila[COL_INTEGRANTE_UNIDAD.fechaIngreso] = _texto(datos.fechaIngreso) ? _parseDate(datos.fechaIngreso) : new Date();
  fila[COL_INTEGRANTE_UNIDAD.fechaSalida] = null;
  fila[COL_INTEGRANTE_UNIDAD.observaciones] = _texto(datos.observaciones);
  var res = _insertarFilaV2(ss, HOJA_V2.integrantesUnidad, COL_INTEGRANTE_UNIDAD, N_COLS_INTEGRANTE_UNIDAD, fila);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.integrantesUnidad, 'asignarIntegranteUnidadV2', 'OK', 'Unidad ' + unidadId + ' ← Vol. ' + voluntarioId);
  return _resOk({ id: res.data.id });
}

/** Egreso de la unidad: cierra la fila activa (append-only, no elimina). */
function egresarIntegranteUnidadV2(id, datos) {
  datos = datos || {};
  var ss = _ss();
  var aplicar = { fechaSalida: _texto(datos.fechaSalida) ? _parseDate(datos.fechaSalida) : new Date() };
  var res = _actualizarFilaV2(ss, HOJA_V2.integrantesUnidad, COL_INTEGRANTE_UNIDAD, N_COLS_INTEGRANTE_UNIDAD, id, aplicar);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.integrantesUnidad, 'egresarIntegranteUnidadV2', 'OK', id);
  return _resOk({ id: id, fechaSalida: _fmtFecha(aplicar.fechaSalida) });
}