/**
 * 38_MigracionesV34F.js — Migraciones V3.4F (CONSOLIDACIÓN FINAL).
 *
 * Correcciones de datos idempotentes sobre la base existente (la hoja real
 * quedó en estado V3.4A; V3.4C/D/E no se ejecutaron en ella):
 *  1. Especialidad 'Sanidad' → 'Auxiliar de Sanidad' por ID (reutiliza
 *     _migrarEspecialidadSanidadV2 de 37) ANTES de la siembra DEMO, porque el
 *     seed busca la especialidad por el nombre nuevo.
 *  2. Subespecialidad 'Stop The Bleed': fija especialidadId → 'Auxiliar de
 *     Sanidad' (en la hoja real quedó sin especialidad).
 *  3. SCI: especialidad 'Sistema de Comando de Incidentes (SCI)' origen
 *     'RECONOCIDA' (área A-3 Operaciones) + 5 niveles como subespecialidades
 *     (Introductorio, Básico Online, Básico, Intermedio, Avanzado). El
 *     catálogo se SIEMBRA pero NO se asigna a ningún voluntario.
 *  4. crearDatosDemoV2() (idempotente): corrige licencias (radio Novicio
 *     CA2OPX N° "No informado" + RPAS DGAC 16418 separadas), 4 habilitaciones
 *     RPAS, A-4, unidades (Operadores RPA Activa, GRA 'En formación'), etc.
 *  5. Emisor 'SUBTEL' en la licencia de radioaficionado (si está vacío).
 *
 * Punto de entrada: `migrarV34F()` (standalone, con LockService).
 */

/** Fija la especialidad de la subespecialidad 'Stop The Bleed' (idempotente). */
function _migrarStopTheBleedV2(ss, r) {
  var subs = _tablaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD);
  var espSanidad = _buscarV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, function (e) {
    return _norm(e.nombre) === 'auxiliar de sanidad';
  });
  if (!espSanidad) { r.detalles.push('ERROR V3.4F: especialidad "Auxiliar de Sanidad" no existe'); return; }
  var corregidas = 0;
  for (var i = 0; i < subs.length; i++) {
    var s = subs[i];
    if (_norm(s.nombre) !== 'stop the bleed') continue;
    if (!_texto(s.especialidadId) || String(s.especialidadId) !== String(espSanidad.id)) {
      var res = _actualizarFilaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD,
        s.id, { 2: espSanidad.id, 7: 'Especialidad asignada (V3.4F): ' + espSanidad.nombre });
      if (res.ok) { corregidas++; r.creados.push('Subespecialidad "Stop The Bleed" (S' + s.id + '): especialidad → ' + espSanidad.nombre); }
      else r.detalles.push('ERROR V3.4F subespecialidad Stop The Bleed: ' + (res.error ? res.error.message : 'desconocido'));
    }
  }
  if (!corregidas) r.omitidos.push('Subespecialidad "Stop The Bleed": ya vinculada a la especialidad de sanidad');
}

/** Siembra SCI (especialidad RECONOCIDA + 5 niveles). Idempotente, sin asignar. */
function _migrarSciV2(ss, r) {
  var nombre = 'Sistema de Comando de Incidentes (SCI)';
  var niveles = ['Introductorio', 'Básico Online', 'Básico', 'Intermedio', 'Avanzado'];
  var area = _buscarV2(ss, HOJA_V2.areas, COL_AREA, N_COLS_AREA, function (a) {
    return _norm(a.nombre) === 'a-3 operaciones';
  });
  var esp = _buscarV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, function (e) {
    return _norm(e.nombre) === _norm(nombre);
  });
  if (esp) {
    r.omitidos.push('Especialidad SCI: ya existe (E' + esp.id + ')');
    // V3.4G: si SCI ya tiene niveles en el campo (col 8), los niveles viven en la
    // especialidad — NO crear subespecialidades de nivel SCI (idempotencia tras
    // migrarV34G, que los eliminó del catálogo).
    if (_texto(esp.niveles)) {
      r.omitidos.push('Especialidad SCI: niveles en campo (V3.4G) — sin subespecialidades de nivel');
      return;
    }
  } else {
    var fila = {};
    fila[COL_ESPECIALIDAD.nombre] = nombre;
    fila[COL_ESPECIALIDAD.areaId] = area ? String(area.id) : '';
    fila[COL_ESPECIALIDAD.descripcion] = 'Sistema de mando unificado para emergencias (RECONOCIDA — nivel nacional).';
    fila[COL_ESPECIALIDAD.origen] = 'RECONOCIDA';
    fila[COL_ESPECIALIDAD.activo] = true;
    var res = _insertarFilaV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, fila);
    if (!res.ok) { r.detalles.push('ERROR V3.4F crear SCI: ' + (res.error ? res.error.message : 'desconocido')); return; }
    esp = _buscarV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, function (e) {
      return String(e.id) === String(res.data.id);
    });
    r.creados.push('Especialidad SCI (RECONOCIDA) → E' + res.data.id);
  }
  var subs = _tablaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD);
  for (var n = 0; n < niveles.length; n++) {
    var nivel = niveles[n];
    var ya = null;
    for (var i = 0; i < subs.length; i++) {
      if (String(subs[i].especialidadId || '') === String(esp.id) && _norm(subs[i].nombre) === _norm(nivel)) { ya = subs[i]; break; }
    }
    if (ya) { r.omitidos.push('Nivel SCI "' + nivel + '": ya existe (S' + ya.id + ')'); continue; }
    var sfila = {};
    sfila[COL_SUBESPECIALIDAD.especialidadId] = String(esp.id);
    sfila[COL_SUBESPECIALIDAD.nombre] = nivel;
    sfila[COL_SUBESPECIALIDAD.descripcion] = 'Nivel ' + nivel + ' del Sistema de Comando de Incidentes (SCI).';
    sfila[COL_SUBESPECIALIDAD.origen] = 'RECONOCIDA';
    sfila[COL_SUBESPECIALIDAD.activo] = true;
    var sres = _insertarFilaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD, sfila);
    if (sres.ok) r.creados.push('Nivel SCI "' + nivel + '" → S' + sres.data.id);
    else r.detalles.push('ERROR V3.4F nivel SCI "' + nivel + '": ' + (sres.error ? sres.error.message : 'desconocido'));
  }
}

/** Emisor SUBTEL en la licencia de radioaficionado (si vacío). Idempotente. */
function _migrarEmisorRadioV2(ss, r) {
  var cred = _buscarV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL, function (c) {
    return _norm(c.nombre) === 'licencia de radioaficionado';
  });
  if (!cred) { r.omitidos.push('Licencia de Radioaficionado: no existe — sin cambios'); return; }
  var aplicar = null;
  if (!_texto(cred.emisor)) {
    aplicar = aplicar || {};
    aplicar[COL_CREDENCIAL.emisor] = 'SUBTEL';
  }
  if (!_texto(cred.numero)) {
    aplicar = aplicar || {};
    aplicar[COL_CREDENCIAL.numero] = 'No informado';
  }
  if (!aplicar) { r.omitidos.push('Licencia de Radioaficionado: emisor SUBTEL ya presente (C' + cred.id + ')'); return; }
  var res = _actualizarFilaV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL, cred.id, aplicar);
  if (res.ok) r.creados.push('Licencia de Radioaficionado (C' + cred.id + '): emisor SUBTEL / N° "No informado" (V3.4F)');
  else r.detalles.push('ERROR V3.4F emisor radio: ' + (res.error ? res.error.message : 'desconocido'));
}

/** Punto de entrada standalone (Editor → migrarV34F). Idempotente. */
function migrarV34F() {
  var ss = _ss();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  var r = null;
  try {
    r = { creados: [], omitidos: [], detalles: [] };
    // Migraciones rápidas bajo el lock…
    _migrarEspecialidadSanidadV2(ss, r);
    _migrarStopTheBleedV2(ss, r);
    _migrarSciV2(ss, r);
    // … y el seed con su propio lock (no se anidan locks).
    lock.releaseLock();
    var seed = crearDatosDemoV2();
    if (seed && seed.ok) {
      for (var c = 0; c < (seed.data.creados || []).length; c++) r.creados.push('Seed: ' + seed.data.creados[c]);
      for (var o = 0; o < (seed.data.omitidos || []).length; o++) r.omitidos.push('Seed: ' + seed.data.omitidos[o]);
      for (var d = 0; d < (seed.data.detalles || []).length; d++) r.detalles.push('Seed: ' + seed.data.detalles[d]);
    } else {
      r.detalles.push('ERROR V3.4F crearDatosDemoV2: ' + (seed && seed.error ? seed.error : 'desconocido'));
    }
    _migrarEmisorRadioV2(ss, r);
    _log(ss, 'Sistema', 'migrarV34F', 'OK',
      (r.creados.length ? r.creados.join('; ') : 'sin cambios') +
      (r.omitidos.length ? ' — omitidos: ' + r.omitidos.length : '') +
      (r.detalles.length ? ' — detalles: ' + r.detalles.join(' | ') : ''));
    return _resOk({ creados: r.creados, omitidos: r.omitidos, detalles: r.detalles });
  } finally {
    try { lock.releaseLock(); } catch (e) { /* ya liberado */ }
  }
}