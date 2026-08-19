/**
 * 37_MigracionesV34D.js — Migraciones V3.4D (CONSOLIDACIÓN OPERACIONAL).
 *
 * Correcciones de datos idempotentes aplicables sobre la base existente:
 *  1. Vestuario de uso permanente → entrega BAJO CARGO (sin devolución):
 *     catálogo v0/V2 (requiereDevolucion=false) y reclasificación de las
 *     entregas históricas 'Pendiente de devolución' de esos elementos.
 *  2. Columnas nuevas (append-only, nunca se eliminan): Personas +3 (foto
 *     por referencia Drive/URL) y Servicios +2 (fechaTermino,
 *     institucionSolicitante) vía _migrarColumnasV2.
 *  3. Especialidad 'Sanidad' → 'Auxiliar de Sanidad' (renombre por ID: las
 *     relaciones históricas se conservan porque el ID no cambia).
 *
 * Punto de entrada: `migrarV34D()` (standalone, con LockService) o integrada
 * en `crearEstructuraV2` (re-ejecutable sin duplicar ni alterar datos).
 */

/** Reclasifica el vestuario bajo cargo y sus entregas pendientes. Idempotente. */
function _migrarVestuarioBajoCargoV2(ss, r) {
  var shCat = ss.getSheetByName(HOJA.catalogo);
  if (!shCat) { r.detalles.push('ERROR V3.4D: hoja Catálogo no existe'); return; }
  var filasCat = shCat.getLastRow() >= PRIMERA_FILA_DATO
    ? shCat.getRange(PRIMERA_FILA_DATO, 1, shCat.getLastRow() - PRIMERA_FILA_DATO + 1, N_COLS_CATALOGO).getValues()
    : [];
  var porElementoId = {};
  var catActualizar = []; // [fila, ...]
  for (var i = 0; i < filasCat.length; i++) {
    var f = filasCat[i];
    var nombre = String(f[COL_CATALOGO.elemento - 1] || '').trim();
    porElementoId[String(f[COL_CATALOGO.id - 1])] = f;
    if (!nombre) continue;
    var bajoCargo = false;
    for (var v = 0; v < VESTUARIO_BAJO_CARGO.length; v++) {
      if (_norm(VESTUARIO_BAJO_CARGO[v]) === _norm(nombre)) { bajoCargo = true; break; }
    }
    if (!bajoCargo) continue;
    var dev = f[COL_CATALOGO.requiereDevolucion - 1];
    var requiere = dev === true || String(dev).toLowerCase() === 'true' || String(dev) === '1';
    if (requiere) catActualizar.push(PRIMERA_FILA_DATO + i);
  }
  if (catActualizar.length) {
    // Escritura por fila: catActualizar no necesariamente son filas consecutivas
    // (puede haber filas vacías u otros elementos entre medias).
    for (var c = 0; c < catActualizar.length; c++) {
      shCat.getRange(catActualizar[c], COL_CATALOGO.requiereDevolucion, 1, 1).setValue(false);
      // Refleja el flip en memoria para que la reclasificación de entregas de
      // ESTA misma ejecución vea el catálogo ya corregido.
      filasCat[catActualizar[c] - PRIMERA_FILA_DATO][COL_CATALOGO.requiereDevolucion - 1] = false;
    }
    r.creados.push('Catálogo: ' + catActualizar.length + ' elemento(s) de vestuario → bajo cargo (sin devolución)');
  }

  // Reclasificación de entregas pendientes de elementos ahora sin devolución.
  var shE = ss.getSheetByName(HOJA.entregas);
  if (!shE) { r.detalles.push('ERROR V3.4D: hoja Entregas no existe'); return; }
  var filasE = shE.getLastRow() >= PRIMERA_FILA_DATO
    ? shE.getRange(PRIMERA_FILA_DATO, 1, shE.getLastRow() - PRIMERA_FILA_DATO + 1, N_COLS_ENTREGA).getValues()
    : [];
  var reclasificar = []; // {fila, elementoId, nombre, obs}
  for (var j = 0; j < filasE.length; j++) {
    var e = filasE[j];
    if (String(e[COL_ENTREGA.estado - 1] || '') !== ESTADO_ENTREGA_INICIAL) continue;
    var cat = porElementoId[String(e[COL_ENTREGA.elementoId - 1])];
    if (!cat) continue;
    var dev2 = cat[COL_CATALOGO.requiereDevolucion - 1];
    var requiere2 = dev2 === true || String(dev2).toLowerCase() === 'true' || String(dev2) === '1';
    if (requiere2) continue;
    reclasificar.push({
      fila: PRIMERA_FILA_DATO + j,
      elementoId: String(e[COL_ENTREGA.elementoId - 1]),
      nombre: String(e[COL_ENTREGA.elemento - 1] || ''),
      obs: String(e[COL_ENTREGA.observaciones - 1] || '')
    });
  }
  if (reclasificar.length) {
    // Escritura por fila: las entregas pendientes no necesariamente son filas consecutivas.
    for (var k = 0; k < reclasificar.length; k++) {
      var re = reclasificar[k];
      var obs = re.obs;
      if (obs.indexOf('(V3.4D') === -1) {
        obs = (obs ? obs + ' | ' : '') + '(V3.4D: reclasificada — entrega bajo cargo, sin devolución)';
      }
      shE.getRange(re.fila, COL_ENTREGA.estado, 1, 1).setValue(ESTADO_ENTREGA_SIN_DEVOLUCION);
      shE.getRange(re.fila, COL_ENTREGA.observaciones, 1, 1).setValue(obs);
    }
    r.creados.push('Entregas: ' + reclasificar.length + ' pendiente(s) reclasificada(s) → ' + ESTADO_ENTREGA_SIN_DEVOLUCION);
  }
  if (!catActualizar.length && !reclasificar.length) r.omitidos.push('Vestuario bajo cargo: sin cambios (ya aplicado)');
}

/** Agrega columnas nuevas V3.4D (Personas +3, Servicios +2). Idempotente. */
function _migrarColumnasV34D(ss, r) {
  var m1 = _migrarColumnasV2(ss, HOJA_V2.personas, ENCABEZADOS_PERSONA, N_COLS_PERSONA);
  if (m1 && m1.ok) {
    if (m1.agregadas) r.creados.push('Personas: +' + m1.agregadas + ' columna(s) (foto)');
    else r.omitidos.push('Personas: columnas V3.4D ya presentes');
  } else if (m1 && m1.error) r.detalles.push('ERROR V3.4D columnas Personas: ' + m1.error.message);
  var m2 = _migrarColumnasV2(ss, HOJA_V2.servicios, ENCABEZADOS_SERVICIO, N_COLS_SERVICIO);
  if (m2 && m2.ok) {
    if (m2.agregadas) r.creados.push('Servicios: +' + m2.agregadas + ' columna(s) (fecha término, institución solicitante)');
    else r.omitidos.push('Servicios: columnas V3.4D ya presentes');
  } else if (m2 && m2.error) r.detalles.push('ERROR V3.4D columnas Servicios: ' + m2.error.message);
}

/** Renombra la especialidad 'Sanidad' → 'Auxiliar de Sanidad' (por ID). Idempotente. */
function _migrarEspecialidadSanidadV2(ss, r) {
  var filas = _tablaV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD);
  var objetivo = null;
  var vieja = null;
  for (var i = 0; i < filas.length; i++) {
    var n = _norm(filas[i].nombre);
    if (n === 'auxiliar de sanidad') objetivo = filas[i];
    if (n === 'sanidad') vieja = filas[i];
  }
  if (objetivo && vieja) {
    // Ya existe con el nombre nuevo y aún hay una 'Sanidad': se desactiva la
    // vieja solo si no tiene asignaciones; si las tiene, se reporta sin tocar.
    r.detalles.push('V3.4D: existen "Auxiliar de Sanidad" (E' + objetivo.id + ') y "Sanidad" (E' + vieja.id + ') — revisar manualmente');
    return;
  }
  if (objetivo) { r.omitidos.push('Especialidad "Auxiliar de Sanidad": ya renombrada (E' + objetivo.id + ')'); return; }
  if (!vieja) { r.omitidos.push('Especialidad "Sanidad": no existe — sin cambios'); return; }
  var obs = String(vieja.observaciones || '');
  if (obs.indexOf('(V3.4D') === -1) {
    obs = (obs ? obs + ' | ' : '') + '(V3.4D: renombrada — el ID no cambia, las relaciones históricas se conservan)';
  }
  var res = _actualizarFilaV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, vieja.id,
    { 2: 'Auxiliar de Sanidad', 7: obs });
  if (res.ok) r.creados.push('Especialidad "Sanidad" → "Auxiliar de Sanidad" (E' + vieja.id + ', ID conservado)');
  else r.detalles.push('ERROR V3.4D renombrar especialidad: ' + (res.error ? res.error.message : 'desconocido'));
}

/** Coordinador V3.4D (sin lock: el llamador es dueño de la sección crítica). */
function _migrarV34D(ss) {
  var r = { creados: [], omitidos: [], detalles: [] };
  _migrarVestuarioBajoCargoV2(ss, r);
  _migrarColumnasV34D(ss, r);
  _migrarEspecialidadSanidadV2(ss, r);
  return r;
}

/** Punto de entrada standalone (Editor → migrarV34D). Idempotente. */
function migrarV34D() {
  var ss = _ss();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    var r = _migrarV34D(ss);
    _log(ss, 'Sistema', 'migrarV34D', 'OK',
      (r.creados.length ? r.creados.join('; ') : 'sin cambios') +
      (r.omitidos.length ? ' — omitidos: ' + r.omitidos.length : '') +
      (r.detalles.length ? ' — detalles: ' + r.detalles.join(' | ') : ''));
    return _resOk({ creados: r.creados, omitidos: r.omitidos, detalles: r.detalles });
  } finally {
    lock.releaseLock();
  }
}