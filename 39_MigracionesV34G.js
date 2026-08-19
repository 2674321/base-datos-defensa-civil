/**
 * 39_MigracionesV34G.js — Migraciones V3.4G (CORRECCIÓN: BIBLIOTECA, GRADOS,
 * ESTRUCTURA DE NIVELES SCI/RADIOAFICIONADO, RPAS Y LIMPIEZA DE OBSERVACIONES).
 *
 * Correcciones de datos idempotentes sobre la base existente (V3.4F ya
 * ejecutada: SCI con 5 subespecialidades, 4 habilitaciones RPAS como
 * subespecialidades, observaciones con referencias a fases de desarrollo):
 *  1. Columnas nuevas al final (idempotente, vía _migrarColumnasV2):
 *     Especialidades.niveles (8), Subespecialidades.niveles (8),
 *     VolCredenciales.nivel (9) + modelosHabilitados (10).
 *  2. SCI pasa a ser UNA especialidad con NIVELES (Introductorio; Básico
 *     Online; Básico; Intermedio; Avanzado). Se eliminan las 5 subespecialidades
 *     de nivel SCI del catálogo (creadas por V3.4F, sin asignaciones).
 *  3. Radioaficionado = 1 subespecialidad de Telecomunicaciones con niveles
 *     (Aspirante; Novicio; General). Se fija su columna niveles.
 *  4. RPAS: 'Operador RPAS' queda como única especialidad INTERNA. Se eliminan
 *     las 4 subespecialidades de habilitación (MAVIC SERIES, MINI 2,
 *     ENTERPRISE 3, ENTERPRISE 3 PRO); las asignaciones se cierran (activo=false)
 *     y los modelos se trasladan a la credencial del voluntario
 *     (VolCredenciales.modelosHabilitados), marcando los no verificados (DEMO).
 *  5. Licencia de radioaficionado: se fija nivel 'Novicio' si está vacío.
 *  6. Limpieza de Observaciones: se eliminan referencias a fases de desarrollo
 *     (V3.4A–F) y texto explicativo de migración de todas las tablas visibles
 *     al usuario. El historial de fases vive en el Log / historial técnico.
 *
 * Punto de entrada: `migrarV34G()` (standalone, con LockService).
 */

/** Limpia un texto de referencias a fases de desarrollo V3.4X y de
 *  explicaciones de migración. Idempotente y conservadora. */
function _limpiarTextoV34G(texto) {
  var t = String(texto || '');
  if (!t) return t;
  // 'FASE V3.4A' / 'V3.4A' / '— V3.4A' / '(V3.4A)' y parentéticos con la fase.
  t = t.replace(/\s*FASE\s*V3\.4[A-F]\b/gi, '');
  t = t.replace(/\s*[—–]\s*V3\.4[A-F]\b/gi, '');
  t = t.replace(/\([^()]*V3\.4[A-F][^()]*\)/gi, '');
  t = t.replace(/\s*\(V3\.4[A-F]\)/gi, '');
  // Prefijos de corrección de migración: 'Corrección V3.4C: ...', etc.
  t = t.replace(/(?:Correcci[oó]n|Respaldo corregido|Respaldo eliminado)\s*\(?V3\.4[A-F]\)?\s*:\s*/gi, '');
  // 'Tipo de licencia (V3.4C): Clase F...' → 'Clase F...'
  t = t.replace(/\s*Tipo de licencia\s*:\s*/gi, '');
  // 'Habilitaciones: MAVIC SERIES, ... (V3.4C).' → '' (los modelos se
  // trasladan a modelosHabilitados en _migrarRpasV2).
  t = t.replace(/\s*Habilitaciones?:[^.!?]*[.!?]/gi, '');
  // Restos de tokens de fase y guiones.
  t = t.replace(/\s*V3\.4[A-F]\b/gi, '');
  t = t.replace(/\s*[—–]\s*\(/gi, ' (');
  // Limpieza fina: espacios, paréntesis vacíos, puntuación.
  t = t.replace(/\s+/g, ' ').trim();
  t = t.replace(/\(\s*\)/g, '');
  t = t.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
  t = t.replace(/^[\s—–:;,.]+/, '').replace(/[\s—–]+$/, '');
  t = t.replace(/\s+([.,;:])/g, '$1');
  t = t.replace(/\s{2,}/g, ' ').trim();
  return t;
}

/** Limpia columnas de texto de una tabla V2. colsTexto: array de
 *  {col, nombre}. Escribe solo las celdas que cambiaron. Idempotente. */
function _limpiarTablaV34G(ss, hoja, colMap, nCols, colsTexto, r, etiqueta) {
  var sh = _hojaV2(ss, hoja);
  if (!sh || sh.getLastRow() < PRIMERA_FILA_DATO) return;
  var filas = _tablaV2(ss, hoja, colMap, nCols);
  var porFila = {};
  for (var i = 0; i < filas.length; i++) porFila[filas[i].fila] = filas[i];
  var cambios = [];
  for (var f in porFila) {
    if (!porFila.hasOwnProperty(f)) continue;
    var row = porFila[f];
    var nfila = Number(f);
    for (var c = 0; c < colsTexto.length; c++) {
      var def = colsTexto[c];
      var limpio = _limpiarTextoV34G(row[def.nombre]);
      if (limpio !== String(row[def.nombre] || '')) {
        cambios.push({ fila: nfila, col: def.col, valor: limpio });
      }
    }
  }
  if (!cambios.length) { r.omitidos.push(etiqueta + ': sin observaciones de fase'); return; }
  for (var j = 0; j < cambios.length; j++) {
    sh.getRange(cambios[j].fila, cambios[j].col).setValue(cambios[j].valor);
  }
  r.creados.push(etiqueta + ': limpiadas ' + cambios.length + ' celda(s)');
}

/** Fija la columna niveles de SCI (especialidad) y Radioaficionado
 *  (subespecialidad). Idempotente. */
function _migrarNivelesV2(ss, r) {
  var sci = _buscarV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, function (e) {
    return _norm(e.nombre) === 'sistema de comando de incidentes (sci)';
  });
  if (sci) {
    var sciNiveles = 'Introductorio; Básico Online; Básico; Intermedio; Avanzado';
    if (_texto(sci.niveles) !== sciNiveles) {
      var res = _actualizarFilaV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, sci.id, { 8: sciNiveles });
      if (res.ok) r.creados.push('Especialidad SCI (E' + sci.id + '): niveles fijados');
      else r.detalles.push('ERROR V3.4G niveles SCI: ' + (res.error ? res.error.message : 'desconocido'));
    } else r.omitidos.push('Especialidad SCI: niveles ya correctos');
  } else r.detalles.push('ERROR V3.4G: especialidad SCI no encontrada');
  var radio = _buscarV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD, function (s) {
    return _norm(s.nombre) === 'radioaficionado';
  });
  if (radio) {
    var radioNiveles = 'Aspirante; Novicio; General';
    if (_texto(radio.niveles) !== radioNiveles) {
      var res2 = _actualizarFilaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD, radio.id, { 8: radioNiveles });
      if (res2.ok) r.creados.push('Subespecialidad Radioaficionado (S' + radio.id + '): niveles fijados');
      else r.detalles.push('ERROR V3.4G niveles radio: ' + (res2.error ? res2.error.message : 'desconocido'));
    } else r.omitidos.push('Subespecialidad Radioaficionado: niveles ya correctos');
  } else r.detalles.push('ERROR V3.4G: subespecialidad Radioaficionado no encontrada');
}

/** Elimina del catálogo las subespecialidades de nivel SCI (creadas por
 *  V3.4F) y las habilitaciones RPAS. Si alguna tiene asignaciones, las cierra
 *  (activo=false) antes. Devuelve las habilitaciones RPAS encontradas. */
function _migrarSubsNivelV2(ss, r) {
  var sh = _hojaV2(ss, HOJA_V2.subespecialidades);
  var subs = _tablaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD);
  var espSci = _buscarV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, function (e) {
    return _norm(e.nombre) === 'sistema de comando de incidentes (sci)';
  });
  var espRpas = _buscarV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, function (e) {
    return _norm(e.nombre) === 'operador rpas';
  });
  var nombresNivelSci = { 'introductorio': 1, 'basico online': 1, 'basico': 1, 'intermedio': 1, 'avanzado': 1 };
  var nombresHabilitacion = { 'mavic series': 1, 'mini 2': 1, 'enterprise 3': 1, 'enterprise 3 pro': 1 };
  var habilitaciones = [];
  var volEsps = _tablaV2(ss, HOJA_V2.voluntarioEspecialidades, COL_VOL_ESPECIALIDAD, N_COLS_VOL_ESPECIALIDAD);
  for (var i = subs.length - 1; i >= 0; i--) {
    var s = subs[i];
    var esNivelSci = espSci && String(s.especialidadId || '') === String(espSci.id) && nombresNivelSci[_norm(s.nombre)];
    var esHab = espRpas && String(s.especialidadId || '') === String(espRpas.id) && nombresHabilitacion[_norm(s.nombre)];
    if (!esNivelSci && !esHab) continue;
    var refs = [];
    for (var v = 0; v < volEsps.length; v++) {
      if (String(volEsps[v].subespecialidadId || '') === String(s.id) && _vigenteV2(volEsps[v].activo)) refs.push(volEsps[v]);
    }
    if (refs.length) {
      for (var q = 0; q < refs.length; q++) {
        var aplica = {};
        aplica[COL_VOL_ESPECIALIDAD.activo] = false;
        var motivo = esHab
          ? 'Habilitación trasladada a la credencial de Operador RPAS del voluntario.'
          : 'Nivel del catálogo SCI eliminado (los niveles viven en la especialidad SCI).';
        if (_texto(refs[q].observaciones)) {
          var base = _limpiarTextoV34G(refs[q].observaciones).replace(/\.?$/, '');
          motivo = base + '. ' + motivo;
        }
        aplica[COL_VOL_ESPECIALIDAD.observaciones] = motivo;
        var cr = _actualizarFilaV2(ss, HOJA_V2.voluntarioEspecialidades, COL_VOL_ESPECIALIDAD, N_COLS_VOL_ESPECIALIDAD, refs[q].id, aplica);
        if (cr.ok) r.creados.push('VolEspecialidad E' + refs[q].id + ' (sub S' + s.id + '): cerrada');
        else r.detalles.push('ERROR V3.4G cerrar VolEsp ' + refs[q].id + ': ' + (cr.error ? cr.error.message : 'desconocido'));
      }
    }
    if (esHab) habilitaciones.push(s);
    sh.deleteRow(s.fila);
    r.creados.push('Subespecialidad S' + s.id + ' "' + s.nombre + '" eliminada del catálogo');
  }
  if (!habilitaciones.length && !subs.some(function (s) {
    return espSci && String(s.especialidadId || '') === String(espSci.id);
  })) r.omitidos.push('Niveles SCI / habilitaciones RPAS: no quedan en catálogo');
  // V3.4G: la iteración fue en orden inverso (borrado por fila); restablece el
  // orden del catálogo para que los modelos coincidan con el seed.
  return habilitaciones.reverse();
}

/** Traslada los modelos de las habilitaciones RPAS a la credencial del
 *  voluntario (modelosHabilitados), marcando los no verificados (DEMO). */
function _migrarModelosRpasV2(ss, r, habilitaciones) {
  if (!habilitaciones.length) return;
  var credRpas = _buscarV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL, function (c) {
    return _norm(c.nombre) === 'licencia de operador rpas';
  });
  if (!credRpas) { r.omitidos.push('Credencial de Operador RPAS: no existe'); return; }
  var volCreds = _tablaV2(ss, HOJA_V2.voluntarioCredenciales, COL_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL);
  var modelos = [];
  for (var h = 0; h < habilitaciones.length; h++) {
    var nom = String(habilitaciones[h].nombre || '').trim();
    if (!nom) continue;
    var marcado = (/enterprise 3/i.test(nom)) ? nom + ' (DEMO)' : nom;
    modelos.push(marcado);
  }
  var listado = _textoNivelesV2(modelos.join(';'));
  if (!listado) return;
  var actualizados = 0;
  for (var i = 0; i < volCreds.length; i++) {
    if (String(volCreds[i].credencialId || '') !== String(credRpas.id)) continue;
    if (String(volCreds[i].estado || '') === 'Revocada') continue;
    if (_textoNivelesV2(volCreds[i].modelosHabilitados) === listado) { r.omitidos.push('Credencial RPAS (VC' + volCreds[i].id + '): modelos ya registrados'); continue; }
    var aplica = {};
    aplica[COL_VOL_CREDENCIAL.modelosHabilitados] = listado;
    var cr = _actualizarFilaV2(ss, HOJA_V2.voluntarioCredenciales, COL_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL, volCreds[i].id, aplica);
    if (cr.ok) { actualizados++; r.creados.push('Credencial RPAS (VC' + volCreds[i].id + '): modelos habilitados → ' + listado); }
    else r.detalles.push('ERROR V3.4G modelos RPAS VC' + volCreds[i].id + ': ' + (cr.error ? cr.error.message : 'desconocido'));
  }
  if (!actualizados && !volCreds.length) r.omitidos.push('Credenciales RPAS: ninguna asignada');
}

/** Fija nivel 'Novicio' (si vacío) en la licencia de radioaficionado. */
function _migrarNivelRadioV2(ss, r) {
  var cred = _buscarV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL, function (c) {
    return _norm(c.nombre) === 'licencia de radioaficionado';
  });
  if (!cred) { r.omitidos.push('Licencia de Radioaficionado: no existe'); return; }
  var volCreds = _tablaV2(ss, HOJA_V2.voluntarioCredenciales, COL_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL);
  var actualizados = 0;
  for (var i = 0; i < volCreds.length; i++) {
    if (String(volCreds[i].credencialId || '') !== String(cred.id)) continue;
    if (_texto(volCreds[i].nivel)) continue;
    var aplica = {};
    aplica[COL_VOL_CREDENCIAL.nivel] = 'Novicio';
    var cr = _actualizarFilaV2(ss, HOJA_V2.voluntarioCredenciales, COL_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL, volCreds[i].id, aplica);
    if (cr.ok) { actualizados++; r.creados.push('Credencial Radioaficionado (VC' + volCreds[i].id + '): nivel Novicio'); }
    else r.detalles.push('ERROR V3.4G nivel radio VC' + volCreds[i].id + ': ' + (cr.error ? cr.error.message : 'desconocido'));
  }
  if (!actualizados) r.omitidos.push('Radioaficionado: nivel ya definido (o sin asignaciones)');
}

/** Limpia Observaciones (y columnas de responsable) de todas las tablas
 *  visibles al usuario. Idempotente. */
function _limpiarObservacionesV2(ss, r) {
  _limpiarTablaV34G(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL, [{ col: COL_CREDENCIAL.observaciones, nombre: 'observaciones' }], r, 'Credenciales');
  _limpiarTablaV34G(ss, HOJA_V2.voluntarioCredenciales, COL_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL, [{ col: COL_VOL_CREDENCIAL.observaciones, nombre: 'observaciones' }], r, 'VolCredenciales');
  _limpiarTablaV34G(ss, HOJA_V2.voluntarioEspecialidades, COL_VOL_ESPECIALIDAD, N_COLS_VOL_ESPECIALIDAD, [{ col: COL_VOL_ESPECIALIDAD.observaciones, nombre: 'observaciones' }], r, 'VolEspecialidades');
  _limpiarTablaV34G(ss, HOJA_V2.voluntarioCapacitaciones, COL_VOL_CAPACITACION, N_COLS_VOL_CAPACITACION, [{ col: COL_VOL_CAPACITACION.observaciones, nombre: 'observaciones' }], r, 'VolCapacitaciones');
  _limpiarTablaV34G(ss, HOJA_V2.historialGrados, COL_HIST_GRADO, N_COLS_HIST_GRADO, [{ col: COL_HIST_GRADO.observaciones, nombre: 'observaciones' }, { col: COL_HIST_GRADO.quienAsigno, nombre: 'quienAsigno' }], r, 'HistorialGrados');
  _limpiarTablaV34G(ss, HOJA_V2.historialCargos, COL_HIST_CARGO, N_COLS_HIST_CARGO, [{ col: COL_HIST_CARGO.observaciones, nombre: 'observaciones' }, { col: COL_HIST_CARGO.quienAsigno, nombre: 'quienAsigno' }], r, 'HistorialCargos');
  _limpiarTablaV34G(ss, HOJA_V2.asistencia, COL_ASISTENCIA, N_COLS_ASISTENCIA, [{ col: COL_ASISTENCIA.observaciones, nombre: 'observaciones' }, { col: COL_ASISTENCIA.responsableRegistro, nombre: 'responsableRegistro' }], r, 'Asistencia');
  _limpiarTablaV34G(ss, HOJA_V2.servicios, COL_SERVICIO, N_COLS_SERVICIO, [{ col: COL_SERVICIO.observaciones, nombre: 'observaciones' }], r, 'Servicios');
  _limpiarTablaV34G(ss, HOJA_V2.unidadesInternas, COL_UNIDAD, N_COLS_UNIDAD, [{ col: COL_UNIDAD.observaciones, nombre: 'observaciones' }], r, 'Unidades');
  _limpiarTablaV34G(ss, HOJA_V2.integrantesUnidad, COL_INTEGRANTE_UNIDAD, N_COLS_INTEGRANTE_UNIDAD, [{ col: COL_INTEGRANTE_UNIDAD.observaciones, nombre: 'observaciones' }], r, 'IntegrantesUnidad');
  _limpiarTablaV34G(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, [{ col: COL_VOLUNTARIO_V2.observaciones, nombre: 'observaciones' }], r, 'VoluntariosV2');
  _limpiarTablaV34G(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA, [{ col: COL_PERSONA.observaciones, nombre: 'observaciones' }], r, 'Personas');
  _limpiarTablaV34G(ss, HOJA_V2.retirosTemporales, COL_RETIRO_TEMPORAL, N_COLS_RETIRO_TEMPORAL, [{ col: COL_RETIRO_TEMPORAL.observaciones, nombre: 'observaciones' }], r, 'RetirosTemporales');
  _limpiarTablaV34G(ss, HOJA_V2.anotaciones, COL_ANOTACION, N_COLS_ANOTACION, [{ col: COL_ANOTACION.observaciones, nombre: 'observaciones' }], r, 'Anotaciones');
  _limpiarTablaV34G(ss, HOJA_V2.documentos, COL_DOCUMENTO, N_COLS_DOCUMENTO, [{ col: COL_DOCUMENTO.observaciones, nombre: 'observaciones' }], r, 'Documentos');
  // Tablas v0 visibles (Entregas, Inventario, Voluntarios).
  var shEnt = ss.getSheetByName(HOJA.entregas);
  if (shEnt && shEnt.getLastRow() >= PRIMERA_FILA_DATO) _limpiarTablaV34G(ss, HOJA.entregas, COL_ENTREGA, N_COLS_ENTREGA, [{ col: COL_ENTREGA.observaciones, nombre: 'observaciones' }], r, 'Entregas(v0)');
  var shInv = ss.getSheetByName(HOJA.inventario);
  if (shInv && shInv.getLastRow() >= PRIMERA_FILA_DATO) _limpiarTablaV34G(ss, HOJA.inventario, COL_INVENTARIO, N_COLS_INVENTARIO, [{ col: COL_INVENTARIO.observaciones, nombre: 'observaciones' }], r, 'Inventario(v0)');
  var shVol = ss.getSheetByName(HOJA.voluntarios);
  if (shVol && shVol.getLastRow() >= PRIMERA_FILA_DATO) _limpiarTablaV34G(ss, HOJA.voluntarios, COL, N_COLS, [{ col: COL.observaciones, nombre: 'observaciones' }], r, 'Voluntarios(v0)');
}

/** Punto de entrada standalone (Editor → migrarV34G). Idempotente. */
function migrarV34G() {
  var ss = _ss();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    var r = { creados: [], omitidos: [], detalles: [] };
    _migrarColumnasV2(ss, HOJA_V2.especialidades, ENCABEZADOS_ESPECIALIDAD, N_COLS_ESPECIALIDAD);
    _migrarColumnasV2(ss, HOJA_V2.subespecialidades, ENCABEZADOS_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD);
    _migrarColumnasV2(ss, HOJA_V2.voluntarioCredenciales, ENCABEZADOS_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL);
    _migrarNivelesV2(ss, r);
    var habilitaciones = _migrarSubsNivelV2(ss, r);
    _migrarModelosRpasV2(ss, r, habilitaciones);
    _migrarNivelRadioV2(ss, r);
    _limpiarObservacionesV2(ss, r);
    _log(ss, 'Sistema', 'migrarV34G', 'OK',
      (r.creados.length ? r.creados.join('; ') : 'sin cambios') +
      (r.omitidos.length ? ' — omitidos: ' + r.omitidos.length : '') +
      (r.detalles.length ? ' — detalles: ' + r.detalles.join(' | ') : ''));
    return _resOk({ creados: r.creados, omitidos: r.omitidos, detalles: r.detalles });
  } finally {
    lock.releaseLock();
  }
}
