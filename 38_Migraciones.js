/**
 * 38_Migraciones.js — Archivo consolidado de migraciones del proyecto.
 *
 * Todas las migraciones anteriores viven aquí. Las que ya fueron ejecutadas
 * y confirmadas quedan COMENTADAS como referencia histórica. Solo la migración
 * de la fase ACTUAL queda activa.
 *
 * Para cada nueva fase: agregar la función de migración en la sección ACTIVA,
 * y una vez ejecutada, moverla a la sección HISTORIAL (comentada).
 *
 * ⚠️ NO ejecutar funciones del historial — ya fueron aplicadas sobre la hoja real.
 */

// ============================================================
// HISTORIAL DE MIGRACIONES EJECUTADAS (referencia, no ejecutar)
// ============================================================

// --- migrarV34D (ejecutada 18/08/2026) ---
// V3.4D: Consolidación operacional — vestuario bajo cargo, columnas Personas/Servicios,
// renombre Sanidad → Auxiliar de Sanidad.
//
// function _migrarVestuarioBajoCargoV2(ss, r) {
//   var shCat = ss.getSheetByName(HOJA.catalogo);
//   if (!shCat) { r.detalles.push('ERROR V3.4D: hoja Catálogo no existe'); return; }
//   var filasCat = shCat.getLastRow() >= PRIMERA_FILA_DATO
//     ? shCat.getRange(PRIMERA_FILA_DATO, 1, shCat.getLastRow() - PRIMERA_FILA_DATO + 1, N_COLS_CATALOGO).getValues()
//     : [];
//   var porElementoId = {};
//   var catActualizar = [];
//   for (var i = 0; i < filasCat.length; i++) {
//     var f = filasCat[i];
//     var nombre = String(f[COL_CATALOGO.elemento - 1] || '').trim();
//     porElementoId[String(f[COL_CATALOGO.id - 1])] = f;
//     if (!nombre) continue;
//     var bajoCargo = false;
//     for (var v = 0; v < VESTUARIO_BAJO_CARGO.length; v++) {
//       if (_norm(VESTUARIO_BAJO_CARGO[v]) === _norm(nombre)) { bajoCargo = true; break; }
//     }
//     if (!bajoCargo) continue;
//     var dev = f[COL_CATALOGO.requiereDevolucion - 1];
//     var requiere = dev === true || String(dev).toLowerCase() === 'true' || String(dev) === '1';
//     if (requiere) catActualizar.push(PRIMERA_FILA_DATO + i);
//   }
//   if (catActualizar.length) {
//     for (var c = 0; c < catActualizar.length; c++) {
//       shCat.getRange(catActualizar[c], COL_CATALOGO.requiereDevolucion, 1, 1).setValue(false);
//       filasCat[catActualizar[c] - PRIMERA_FILA_DATO][COL_CATALOGO.requiereDevolucion - 1] = false;
//     }
//     r.creados.push('Catálogo: ' + catActualizar.length + ' elemento(s) de vestuario → bajo cargo (sin devolución)');
//   }
//   var shE = ss.getSheetByName(HOJA.entregas);
//   if (!shE) { r.detalles.push('ERROR V3.4D: hoja Entregas no existe'); return; }
//   var filasE = shE.getLastRow() >= PRIMERA_FILA_DATO
//     ? shE.getRange(PRIMERA_FILA_DATO, 1, shE.getLastRow() - PRIMERA_FILA_DATO + 1, N_COLS_ENTREGA).getValues()
//     : [];
//   var reclasificar = [];
//   for (var j = 0; j < filasE.length; j++) {
//     var e = filasE[j];
//     if (String(e[COL_ENTREGA.estado - 1] || '') !== ESTADO_ENTREGA_INICIAL) continue;
//     var cat = porElementoId[String(e[COL_ENTREGA.elementoId - 1])];
//     if (!cat) continue;
//     var dev2 = cat[COL_CATALOGO.requiereDevolucion - 1];
//     var requiere2 = dev2 === true || String(dev2).toLowerCase() === 'true' || String(dev2) === '1';
//     if (requiere2) continue;
//     reclasificar.push({
//       fila: PRIMERA_FILA_DATO + j,
//       elementoId: String(e[COL_ENTREGA.elementoId - 1]),
//       nombre: String(e[COL_ENTREGA.elemento - 1] || ''),
//       obs: String(e[COL_ENTREGA.observaciones - 1] || '')
//     });
//   }
//   if (reclasificar.length) {
//     for (var k = 0; k < reclasificar.length; k++) {
//       var re = reclasificar[k];
//       var obs = re.obs;
//       if (obs.indexOf('(V3.4D') === -1) {
//         obs = (obs ? obs + ' | ' : '') + '(V3.4D: reclasificada — entrega bajo cargo, sin devolución)';
//       }
//       shE.getRange(re.fila, COL_ENTREGA.estado, 1, 1).setValue(ESTADO_ENTREGA_SIN_DEVOLUCION);
//       shE.getRange(re.fila, COL_ENTREGA.observaciones, 1, 1).setValue(obs);
//     }
//     r.creados.push('Entregas: ' + reclasificar.length + ' pendiente(s) reclasificada(s) → ' + ESTADO_ENTREGA_SIN_DEVOLUCION);
//   }
//   if (!catActualizar.length && !reclasificar.length) r.omitidos.push('Vestuario bajo cargo: sin cambios (ya aplicado)');
// }
//
// function _migrarColumnasV34D(ss, r) {
//   var m1 = _migrarColumnasV2(ss, HOJA_V2.personas, ENCABEZADOS_PERSONA, N_COLS_PERSONA);
//   if (m1 && m1.ok) {
//     if (m1.agregadas) r.creados.push('Personas: +' + m1.agregadas + ' columna(s) (foto)');
//     else r.omitidos.push('Personas: columnas V3.4D ya presentes');
//   } else if (m1 && m1.error) r.detalles.push('ERROR V3.4D columnas Personas: ' + m1.error.message);
//   var m2 = _migrarColumnasV2(ss, HOJA_V2.servicios, ENCABEZADOS_SERVICIO, N_COLS_SERVICIO);
//   if (m2 && m2.ok) {
//     if (m2.agregadas) r.creados.push('Servicios: +' + m2.agregadas + ' columna(s) (fecha término, institución solicitante)');
//     else r.omitidos.push('Servicios: columnas V3.4D ya presentes');
//   } else if (m2 && m2.error) r.detalles.push('ERROR V3.4D columnas Servicios: ' + m2.error.message);
// }
//
// function _migrarEspecialidadSanidadV2(ss, r) {
//   var filas = _tablaV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD);
//   var objetivo = null;
//   var vieja = null;
//   for (var i = 0; i < filas.length; i++) {
//     var n = _norm(filas[i].nombre);
//     if (n === 'auxiliar de sanidad') objetivo = filas[i];
//     if (n === 'sanidad') vieja = filas[i];
//   }
//   if (objetivo && vieja) {
//     r.detalles.push('V3.4D: existen "Auxiliar de Sanidad" (E' + objetivo.id + ') y "Sanidad" (E' + vieja.id + ') — revisar manualmente');
//     return;
//   }
//   if (objetivo) { r.omitidos.push('Especialidad "Auxiliar de Sanidad": ya renombrada (E' + objetivo.id + ')'); return; }
//   if (!vieja) { r.omitidos.push('Especialidad "Sanidad": no existe — sin cambios'); return; }
//   var obs = String(vieja.observaciones || '');
//   if (obs.indexOf('(V3.4D') === -1) {
//     obs = (obs ? obs + ' | ' : '') + '(V3.4D: renombrada — el ID no cambia, las relaciones históricas se conservan)';
//   }
//   var res = _actualizarFilaV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, vieja.id,
//     { 2: 'Auxiliar de Sanidad', 7: obs });
//   if (res.ok) r.creados.push('Especialidad "Sanidad" → "Auxiliar de Sanidad" (E' + vieja.id + ', ID conservado)');
//   else r.detalles.push('ERROR V3.4D renombrar especialidad: ' + (res.error ? res.error.message : 'desconocido'));
// }
//
// function _migrarV34D(ss) {
//   var r = { creados: [], omitidos: [], detalles: [] };
//   _migrarVestuarioBajoCargoV2(ss, r);
//   _migrarColumnasV34D(ss, r);
//   _migrarEspecialidadSanidadV2(ss, r);
//   return r;
// }
//
// function migrarV34D() {
//   var ss = _ss();
//   var lock = LockService.getScriptLock();
//   if (!lock.tryLock(10000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
//   try {
//     var r = _migrarV34D(ss);
//     _log(ss, 'Sistema', 'migrarV34D', 'OK',
//       (r.creados.length ? r.creados.join('; ') : 'sin cambios') +
//       (r.omitidos.length ? ' — omitidos: ' + r.omitidos.length : '') +
//       (r.detalles.length ? ' — detalles: ' + r.detalles.join(' | ') : ''));
//     return _resOk({ creados: r.creados, omitidos: r.omitidos, detalles: r.detalles });
//   } finally {
//     lock.releaseLock();
//   }
// }

// --- migrarV34F (ejecutada 18/08/2026) ---
// V3.4F: Consolidación final — Stop The Bleed, SCI, seed DEMO, emisor SUBTEL.
// NOTA: _migrarEspecialidadSanidadV2 se reutilizó de V3.4D (definida arriba comentada).
//
// function _migrarStopTheBleedV2(ss, r) {
//   var subs = _tablaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD);
//   var espSanidad = _buscarV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, function (e) {
//     return _norm(e.nombre) === 'auxiliar de sanidad';
//   });
//   if (!espSanidad) { r.detalles.push('ERROR V3.4F: especialidad "Auxiliar de Sanidad" no existe'); return; }
//   var corregidas = 0;
//   for (var i = 0; i < subs.length; i++) {
//     var s = subs[i];
//     if (_norm(s.nombre) !== 'stop the bleed') continue;
//     if (!_texto(s.especialidadId) || String(s.especialidadId) !== String(espSanidad.id)) {
//       var res = _actualizarFilaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD,
//         s.id, { 2: espSanidad.id, 7: 'Especialidad asignada (V3.4F): ' + espSanidad.nombre });
//       if (res.ok) { corregidas++; r.creados.push('Subespecialidad "Stop The Bleed" (S' + s.id + '): especialidad → ' + espSanidad.nombre); }
//       else r.detalles.push('ERROR V3.4F subespecialidad Stop The Bleed: ' + (res.error ? res.error.message : 'desconocido'));
//     }
//   }
//   if (!corregidas) r.omitidos.push('Subespecialidad "Stop The Bleed": ya vinculada a la especialidad de sanidad');
// }
//
// function _migrarSciV2(ss, r) {
//   var nombre = 'Sistema de Comando de Incidentes (SCI)';
//   var niveles = ['Introductorio', 'Básico Online', 'Básico', 'Intermedio', 'Avanzado'];
//   var area = _buscarV2(ss, HOJA_V2.areas, COL_AREA, N_COLS_AREA, function (a) {
//     return _norm(a.nombre) === 'a-3 operaciones';
//   });
//   var esp = _buscarV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, function (e) {
//     return _norm(e.nombre) === _norm(nombre);
//   });
//   if (esp) {
//     r.omitidos.push('Especialidad SCI: ya existe (E' + esp.id + ')');
//     if (_texto(esp.niveles)) {
//       r.omitidos.push('Especialidad SCI: niveles en campo (V3.4G) — sin subespecialidades de nivel');
//       return;
//     }
//   } else {
//     var fila = {};
//     fila[COL_ESPECIALIDAD.nombre] = nombre;
//     fila[COL_ESPECIALIDAD.areaId] = area ? String(area.id) : '';
//     fila[COL_ESPECIALIDAD.descripcion] = 'Sistema de mando unificado para emergencias (RECONOCIDA — nivel nacional).';
//     fila[COL_ESPECIALIDAD.origen] = 'RECONOCIDA';
//     fila[COL_ESPECIALIDAD.activo] = true;
//     var res = _insertarFilaV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, fila);
//     if (!res.ok) { r.detalles.push('ERROR V3.4F crear SCI: ' + (res.error ? res.error.message : 'desconocido')); return; }
//     esp = _buscarV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, function (e) {
//       return String(e.id) === String(res.data.id);
//     });
//     r.creados.push('Especialidad SCI (RECONOCIDA) → E' + res.data.id);
//   }
//   var subs = _tablaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD);
//   for (var n = 0; n < niveles.length; n++) {
//     var nivel = niveles[n];
//     var ya = null;
//     for (var i = 0; i < subs.length; i++) {
//       if (String(subs[i].especialidadId || '') === String(esp.id) && _norm(subs[i].nombre) === _norm(nivel)) { ya = subs[i]; break; }
//     }
//     if (ya) { r.omitidos.push('Nivel SCI "' + nivel + '": ya existe (S' + ya.id + ')'); continue; }
//     var sfila = {};
//     sfila[COL_SUBESPECIALIDAD.especialidadId] = String(esp.id);
//     sfila[COL_SUBESPECIALIDAD.nombre] = nivel;
//     sfila[COL_SUBESPECIALIDAD.descripcion] = 'Nivel ' + nivel + ' del Sistema de Comando de Incidentes (SCI).';
//     sfila[COL_SUBESPECIALIDAD.origen] = 'RECONOCIDA';
//     sfila[COL_SUBESPECIALIDAD.activo] = true;
//     var sres = _insertarFilaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD, sfila);
//     if (sres.ok) r.creados.push('Nivel SCI "' + nivel + '" → S' + sres.data.id);
//     else r.detalles.push('ERROR V3.4F nivel SCI "' + nivel + '": ' + (sres.error ? sres.error.message : 'desconocido'));
//   }
// }
//
// function _migrarEmisorRadioV2(ss, r) {
//   var cred = _buscarV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL, function (c) {
//     return _norm(c.nombre) === 'licencia de radioaficionado';
//   });
//   if (!cred) { r.omitidos.push('Licencia de Radioaficionado: no existe — sin cambios'); return; }
//   var aplicar = null;
//   if (!_texto(cred.emisor)) {
//     aplicar = aplicar || {};
//     aplicar[COL_CREDENCIAL.emisor] = 'SUBTEL';
//   }
//   if (!_texto(cred.numero)) {
//     aplicar = aplicar || {};
//     aplicar[COL_CREDENCIAL.numero] = 'No informado';
//   }
//   if (!aplicar) { r.omitidos.push('Licencia de Radioaficionado: emisor SUBTEL ya presente (C' + cred.id + ')'); return; }
//   var res = _actualizarFilaV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL, cred.id, aplicar);
//   if (res.ok) r.creados.push('Licencia de Radioaficionado (C' + cred.id + '): emisor SUBTEL / N° "No informado" (V3.4F)');
//   else r.detalles.push('ERROR V3.4F emisor radio: ' + (res.error ? res.error.message : 'desconocido'));
// }
//
// function migrarV34F() {
//   var ss = _ss();
//   var lock = LockService.getScriptLock();
//   if (!lock.tryLock(20000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
//   var r = null;
//   try {
//     r = { creados: [], omitidos: [], detalles: [] };
//     _migrarEspecialidadSanidadV2(ss, r);
//     _migrarStopTheBleedV2(ss, r);
//     _migrarSciV2(ss, r);
//     lock.releaseLock();
//     var seed = crearDatosDemoV2();
//     if (seed && seed.ok) {
//       for (var c = 0; c < (seed.data.creados || []).length; c++) r.creados.push('Seed: ' + seed.data.creados[c]);
//       for (var o = 0; o < (seed.data.omitidos || []).length; o++) r.omitidos.push('Seed: ' + seed.data.omitidos[o]);
//       for (var d = 0; d < (seed.data.detalles || []).length; d++) r.detalles.push('Seed: ' + seed.data.detalles[d]);
//     } else {
//       r.detalles.push('ERROR V3.4F crearDatosDemoV2: ' + (seed && seed.error ? seed.error : 'desconocido'));
//     }
//     _migrarEmisorRadioV2(ss, r);
//     _log(ss, 'Sistema', 'migrarV34F', 'OK',
//       (r.creados.length ? r.creados.join('; ') : 'sin cambios') +
//       (r.omitidos.length ? ' — omitidos: ' + r.omitidos.length : '') +
//       (r.detalles.length ? ' — detalles: ' + r.detalles.join(' | ') : ''));
//     return _resOk({ creados: r.creados, omitidos: r.omitidos, detalles: r.detalles });
//   } finally {
//     try { lock.releaseLock(); } catch (e) { /* ya liberado */ }
//   }
// }

// --- migrarV34G (ejecutada 18/08/2026) ---
// V3.4G: Biblioteca, grados, niveles SCI/RPAS, limpieza de observaciones.
//
// function _limpiarTextoV34G(texto) {
//   var t = String(texto || '');
//   if (!t) return t;
//   t = t.replace(/\s*FASE\s*V3\.4[A-F]\b/gi, '');
//   t = t.replace(/\s*[—–]\s*V3\.4[A-F]\b/gi, '');
//   t = t.replace(/\([^()]*V3\.4[A-F][^()]*\)/gi, '');
//   t = t.replace(/\s*\(V3\.4[A-F]\)/gi, '');
//   t = t.replace(/(?:Correcci[oó]n|Respaldo corregido|Respaldo eliminado)\s*\(?V3\.4[A-F]\)?\s*:\s*/gi, '');
//   t = t.replace(/\s*Tipo de licencia\s*:\s*/gi, '');
//   t = t.replace(/\s*Habilitaciones?:[^.!?]*[.!?]/gi, '');
//   t = t.replace(/\s*V3\.4[A-F]\b/gi, '');
//   t = t.replace(/\s*[—–]\s*\(/gi, ' (');
//   t = t.replace(/\s+/g, ' ').trim();
//   t = t.replace(/\(\s*\)/g, '');
//   t = t.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
//   t = t.replace(/^[\s—–:;,.]+/, '').replace(/[\s—–]+$/, '');
//   t = t.replace(/\s+([.,;:])/g, '$1');
//   t = t.replace(/\s{2,}/g, ' ').trim();
//   return t;
// }
//
// function _limpiarTablaV34G(ss, hoja, colMap, nCols, colsTexto, r, etiqueta) {
//   var sh = _hojaV2(ss, hoja);
//   if (!sh || sh.getLastRow() < PRIMERA_FILA_DATO) return;
//   var filas = _tablaV2(ss, hoja, colMap, nCols);
//   var porFila = {};
//   for (var i = 0; i < filas.length; i++) porFila[filas[i].fila] = filas[i];
//   var cambios = [];
//   for (var f in porFila) {
//     if (!porFila.hasOwnProperty(f)) continue;
//     var row = porFila[f];
//     var nfila = Number(f);
//     for (var c = 0; c < colsTexto.length; c++) {
//       var def = colsTexto[c];
//       var limpio = _limpiarTextoV34G(row[def.nombre]);
//       if (limpio !== String(row[def.nombre] || '')) {
//         cambios.push({ fila: nfila, col: def.col, valor: limpio });
//       }
//     }
//   }
//   if (!cambios.length) { r.omitidos.push(etiqueta + ': sin observaciones de fase'); return; }
//   for (var j = 0; j < cambios.length; j++) {
//     sh.getRange(cambios[j].fila, cambios[j].col).setValue(cambios[j].valor);
//   }
//   r.creados.push(etiqueta + ': limpiadas ' + cambios.length + ' celda(s)');
// }
//
// function _migrarNivelesV2(ss, r) {
//   var sci = _buscarV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, function (e) {
//     return _norm(e.nombre) === 'sistema de comando de incidentes (sci)';
//   });
//   if (sci) {
//     var sciNiveles = 'Introductorio; Básico Online; Básico; Intermedio; Avanzado';
//     if (_texto(sci.niveles) !== sciNiveles) {
//       var res = _actualizarFilaV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, sci.id, { 8: sciNiveles });
//       if (res.ok) r.creados.push('Especialidad SCI (E' + sci.id + '): niveles fijados');
//       else r.detalles.push('ERROR V3.4G niveles SCI: ' + (res.error ? res.error.message : 'desconocido'));
//     } else r.omitidos.push('Especialidad SCI: niveles ya correctos');
//   } else r.detalles.push('ERROR V3.4G: especialidad SCI no encontrada');
//   var radio = _buscarV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD, function (s) {
//     return _norm(s.nombre) === 'radioaficionado';
//   });
//   if (radio) {
//     var radioNiveles = 'Aspirante; Novicio; General';
//     if (_texto(radio.niveles) !== radioNiveles) {
//       var res2 = _actualizarFilaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD, radio.id, { 8: radioNiveles });
//       if (res2.ok) r.creados.push('Subespecialidad Radioaficionado (S' + radio.id + '): niveles fijados');
//       else r.detalles.push('ERROR V3.4G niveles radio: ' + (res2.error ? res2.error.message : 'desconocido'));
//     } else r.omitidos.push('Subespecialidad Radioaficionado: niveles ya correctos');
//   } else r.detalles.push('ERROR V3.4G: subespecialidad Radioaficionado no encontrada');
// }
//
// function _migrarSubsNivelV2(ss, r) {
//   var sh = _hojaV2(ss, HOJA_V2.subespecialidades);
//   var subs = _tablaV2(ss, HOJA_V2.subespecialidades, COL_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD);
//   var espSci = _buscarV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, function (e) {
//     return _norm(e.nombre) === 'sistema de comando de incidentes (sci)';
//   });
//   var espRpas = _buscarV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD, function (e) {
//     return _norm(e.nombre) === 'operador rpas';
//   });
//   var nombresNivelSci = { 'introductorio': 1, 'basico online': 1, 'basico': 1, 'intermedio': 1, 'avanzado': 1 };
//   var nombresHabilitacion = { 'mavic series': 1, 'mini 2': 1, 'enterprise 3': 1, 'enterprise 3 pro': 1 };
//   var habilitaciones = [];
//   var volEsps = _tablaV2(ss, HOJA_V2.voluntarioEspecialidades, COL_VOL_ESPECIALIDAD, N_COLS_VOL_ESPECIALIDAD);
//   for (var i = subs.length - 1; i >= 0; i--) {
//     var s = subs[i];
//     var esNivelSci = espSci && String(s.especialidadId || '') === String(espSci.id) && nombresNivelSci[_norm(s.nombre)];
//     var esHab = espRpas && String(s.especialidadId || '') === String(espRpas.id) && nombresHabilitacion[_norm(s.nombre)];
//     if (!esNivelSci && !esHab) continue;
//     var refs = [];
//     for (var v = 0; v < volEsps.length; v++) {
//       if (String(volEsps[v].subespecialidadId || '') === String(s.id) && _vigenteV2(volEsps[v].activo)) refs.push(volEsps[v]);
//     }
//     if (refs.length) {
//       for (var q = 0; q < refs.length; q++) {
//         var aplica = {};
//         aplica[COL_VOL_ESPECIALIDAD.activo] = false;
//         var motivo = esHab
//           ? 'Habilitación trasladada a la credencial de Operador RPAS del voluntario.'
//           : 'Nivel del catálogo SCI eliminado (los niveles viven en la especialidad SCI).';
//         if (_texto(refs[q].observaciones)) {
//           var base = _limpiarTextoV34G(refs[q].observaciones).replace(/\.?$/, '');
//           motivo = base + '. ' + motivo;
//         }
//         aplica[COL_VOL_ESPECIALIDAD.observaciones] = motivo;
//         var cr = _actualizarFilaV2(ss, HOJA_V2.voluntarioEspecialidades, COL_VOL_ESPECIALIDAD, N_COLS_VOL_ESPECIALIDAD, refs[q].id, aplica);
//         if (cr.ok) r.creados.push('VolEspecialidad E' + refs[q].id + ' (sub S' + s.id + '): cerrada');
//         else r.detalles.push('ERROR V3.4G cerrar VolEsp ' + refs[q].id + ': ' + (cr.error ? cr.error.message : 'desconocido'));
//       }
//     }
//     if (esHab) habilitaciones.push(s);
//     sh.deleteRow(s.fila);
//     r.creados.push('Subespecialidad S' + s.id + ' "' + s.nombre + '" eliminada del catálogo');
//   }
//   if (!habilitaciones.length && !subs.some(function (s) {
//     return espSci && String(s.especialidadId || '') === String(espSci.id);
//   })) r.omitidos.push('Niveles SCI / habilitaciones RPAS: no quedan en catálogo');
//   return habilitaciones.reverse();
// }
//
// function _migrarModelosRpasV2(ss, r, habilitaciones) {
//   if (!habilitaciones.length) return;
//   var credRpas = _buscarV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL, function (c) {
//     return _norm(c.nombre) === 'licencia de operador rpas';
//   });
//   if (!credRpas) { r.omitidos.push('Credencial de Operador RPAS: no existe'); return; }
//   var volCreds = _tablaV2(ss, HOJA_V2.voluntarioCredenciales, COL_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL);
//   var modelos = [];
//   for (var h = 0; h < habilitaciones.length; h++) {
//     var nom = String(habilitaciones[h].nombre || '').trim();
//     if (!nom) continue;
//     var marcado = (/enterprise 3/i.test(nom)) ? nom + ' (DEMO)' : nom;
//     modelos.push(marcado);
//   }
//   var listado = _textoNivelesV2(modelos.join(';'));
//   if (!listado) return;
//   var actualizados = 0;
//   for (var i = 0; i < volCreds.length; i++) {
//     if (String(volCreds[i].credencialId || '') !== String(credRpas.id)) continue;
//     if (String(volCreds[i].estado || '') === 'Revocada') continue;
//     if (_textoNivelesV2(volCreds[i].modelosHabilitados) === listado) { r.omitidos.push('Credencial RPAS (VC' + volCreds[i].id + '): modelos ya registrados'); continue; }
//     var aplica = {};
//     aplica[COL_VOL_CREDENCIAL.modelosHabilitados] = listado;
//     var cr = _actualizarFilaV2(ss, HOJA_V2.voluntarioCredenciales, COL_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL, volCreds[i].id, aplica);
//     if (cr.ok) { actualizados++; r.creados.push('Credencial RPAS (VC' + volCreds[i].id + '): modelos habilitados → ' + listado); }
//     else r.detalles.push('ERROR V3.4G modelos RPAS VC' + volCreds[i].id + ': ' + (cr.error ? cr.error.message : 'desconocido'));
//   }
//   if (!actualizados && !volCreds.length) r.omitidos.push('Credenciales RPAS: ninguna asignada');
// }
//
// function _migrarNivelRadioV2(ss, r) {
//   var cred = _buscarV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL, function (c) {
//     return _norm(c.nombre) === 'licencia de radioaficionado';
//   });
//   if (!cred) { r.omitidos.push('Licencia de Radioaficionado: no existe'); return; }
//   var volCreds = _tablaV2(ss, HOJA_V2.voluntarioCredenciales, COL_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL);
//   var actualizados = 0;
//   for (var i = 0; i < volCreds.length; i++) {
//     if (String(volCreds[i].credencialId || '') !== String(cred.id)) continue;
//     if (_texto(volCreds[i].nivel)) continue;
//     var aplica = {};
//     aplica[COL_VOL_CREDENCIAL.nivel] = 'Novicio';
//     var cr = _actualizarFilaV2(ss, HOJA_V2.voluntarioCredenciales, COL_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL, volCreds[i].id, aplica);
//     if (cr.ok) { actualizados++; r.creados.push('Credencial Radioaficionado (VC' + volCreds[i].id + '): nivel Novicio'); }
//     else r.detalles.push('ERROR V3.4G nivel radio VC' + volCreds[i].id + ': ' + (cr.error ? cr.error.message : 'desconocido'));
//   }
//   if (!actualizados) r.omitidos.push('Radioaficionado: nivel ya definido (o sin asignaciones)');
// }
//
// function _limpiarObservacionesV2(ss, r) {
//   _limpiarTablaV34G(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL, [{ col: COL_CREDENCIAL.observaciones, nombre: 'observaciones' }], r, 'Credenciales');
//   _limpiarTablaV34G(ss, HOJA_V2.voluntarioCredenciales, COL_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL, [{ col: COL_VOL_CREDENCIAL.observaciones, nombre: 'observaciones' }], r, 'VolCredenciales');
//   _limpiarTablaV34G(ss, HOJA_V2.voluntarioEspecialidades, COL_VOL_ESPECIALIDAD, N_COLS_VOL_ESPECIALIDAD, [{ col: COL_VOL_ESPECIALIDAD.observaciones, nombre: 'observaciones' }], r, 'VolEspecialidades');
//   _limpiarTablaV34G(ss, HOJA_V2.voluntarioCapacitaciones, COL_VOL_CAPACITACION, N_COLS_VOL_CAPACITACION, [{ col: COL_VOL_CAPACITACION.observaciones, nombre: 'observaciones' }], r, 'VolCapacitaciones');
//   _limpiarTablaV34G(ss, HOJA_V2.historialGrados, COL_HIST_GRADO, N_COLS_HIST_GRADO, [{ col: COL_HIST_GRADO.observaciones, nombre: 'observaciones' }, { col: COL_HIST_GRADO.quienAsigno, nombre: 'quienAsigno' }], r, 'HistorialGrados');
//   _limpiarTablaV34G(ss, HOJA_V2.historialCargos, COL_HIST_CARGO, N_COLS_HIST_CARGO, [{ col: COL_HIST_CARGO.observaciones, nombre: 'observaciones' }, { col: COL_HIST_CARGO.quienAsigno, nombre: 'quienAsigno' }], r, 'HistorialCargos');
//   _limpiarTablaV34G(ss, HOJA_V2.asistencia, COL_ASISTENCIA, N_COLS_ASISTENCIA, [{ col: COL_ASISTENCIA.observaciones, nombre: 'observaciones' }, { col: COL_ASISTENCIA.responsableRegistro, nombre: 'responsableRegistro' }], r, 'Asistencia');
//   _limpiarTablaV34G(ss, HOJA_V2.servicios, COL_SERVICIO, N_COLS_SERVICIO, [{ col: COL_SERVICIO.observaciones, nombre: 'observaciones' }], r, 'Servicios');
//   _limpiarTablaV34G(ss, HOJA_V2.unidadesInternas, COL_UNIDAD, N_COLS_UNIDAD, [{ col: COL_UNIDAD.observaciones, nombre: 'observaciones' }], r, 'Unidades');
//   _limpiarTablaV34G(ss, HOJA_V2.integrantesUnidad, COL_INTEGRANTE_UNIDAD, N_COLS_INTEGRANTE_UNIDAD, [{ col: COL_INTEGRANTE_UNIDAD.observaciones, nombre: 'observaciones' }], r, 'IntegrantesUnidad');
//   _limpiarTablaV34G(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, [{ col: COL_VOLUNTARIO_V2.observaciones, nombre: 'observaciones' }], r, 'VoluntariosV2');
//   _limpiarTablaV34G(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA, [{ col: COL_PERSONA.observaciones, nombre: 'observaciones' }], r, 'Personas');
//   _limpiarTablaV34G(ss, HOJA_V2.retirosTemporales, COL_RETIRO_TEMPORAL, N_COLS_RETIRO_TEMPORAL, [{ col: COL_RETIRO_TEMPORAL.observaciones, nombre: 'observaciones' }], r, 'RetirosTemporales');
//   _limpiarTablaV34G(ss, HOJA_V2.anotaciones, COL_ANOTACION, N_COLS_ANOTACION, [{ col: COL_ANOTACION.observaciones, nombre: 'observaciones' }], r, 'Anotaciones');
//   _limpiarTablaV34G(ss, HOJA_V2.documentos, COL_DOCUMENTO, N_COLS_DOCUMENTO, [{ col: COL_DOCUMENTO.observaciones, nombre: 'observaciones' }], r, 'Documentos');
//   var shEnt = ss.getSheetByName(HOJA.entregas);
//   if (shEnt && shEnt.getLastRow() >= PRIMERA_FILA_DATO) _limpiarTablaV34G(ss, HOJA.entregas, COL_ENTREGA, N_COLS_ENTREGA, [{ col: COL_ENTREGA.observaciones, nombre: 'observaciones' }], r, 'Entregas(v0)');
//   var shInv = ss.getSheetByName(HOJA.inventario);
//   if (shInv && shInv.getLastRow() >= PRIMERA_FILA_DATO) _limpiarTablaV34G(ss, HOJA.inventario, COL_INVENTARIO, N_COLS_INVENTARIO, [{ col: COL_INVENTARIO.observaciones, nombre: 'observaciones' }], r, 'Inventario(v0)');
//   var shVol = ss.getSheetByName(HOJA.voluntarios);
//   if (shVol && shVol.getLastRow() >= PRIMERA_FILA_DATO) _limpiarTablaV34G(ss, HOJA.voluntarios, COL, N_COLS, [{ col: COL.observaciones, nombre: 'observaciones' }], r, 'Voluntarios(v0)');
// }
//
// function migrarV34G() {
//   var ss = _ss();
//   var lock = LockService.getScriptLock();
//   if (!lock.tryLock(20000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
//   try {
//     var r = { creados: [], omitidos: [], detalles: [] };
//     _migrarColumnasV2(ss, HOJA_V2.especialidades, ENCABEZADOS_ESPECIALIDAD, N_COLS_ESPECIALIDAD);
//     _migrarColumnasV2(ss, HOJA_V2.subespecialidades, ENCABEZADOS_SUBESPECIALIDAD, N_COLS_SUBESPECIALIDAD);
//     _migrarColumnasV2(ss, HOJA_V2.voluntarioCredenciales, ENCABEZADOS_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL);
//     _migrarNivelesV2(ss, r);
//     var habilitaciones = _migrarSubsNivelV2(ss, r);
//     _migrarModelosRpasV2(ss, r, habilitaciones);
//     _migrarNivelRadioV2(ss, r);
//     _limpiarObservacionesV2(ss, r);
//     _log(ss, 'Sistema', 'migrarV34G', 'OK',
//       (r.creados.length ? r.creados.join('; ') : 'sin cambios') +
//       (r.omitidos.length ? ' — omitidos: ' + r.omitidos.length : '') +
//       (r.detalles.length ? ' — detalles: ' + r.detalles.join(' | ') : ''));
//     return _resOk({ creados: r.creados, omitidos: r.omitidos, detalles: r.detalles });
//   } finally {
//     lock.releaseLock();
//   }
// }

// ============================================================
// MIGRACIÓN ACTUAL (V3.4H — en desarrollo / ejecutada)
// ============================================================

/**
 * V3.4H: respaldo + reset transaccional + re-siembra.
 *
 * Punto de entrada: `resetYSembrarV34H()` (Editor, con LockService).
 * Antes de borrar, crea una pestaña de respaldo con timestamp de las hojas
 * transaccionales que se van a limpiar. Los catálogos y el log NO se tocan.
 *
 * Hojas que SE RESPALDAN Y LIMPIAN (transaccionales):
 *  Personas, VoluntariosV2, Historial Grados, Historial Cargos,
 *  Voluntario Especialidades, Voluntario Credenciales, Voluntario Capacitaciones,
 *  Integrantes Unidad, Servicios, ServicioVoluntarios, Asistencia,
 *  Hoja de Servicios, Anotaciones, Documentos, RetirosTemporales,
 *  Devoluciones, v0 Voluntarios, v0 Inventario, v0 Entregas.
 *
 * Hojas que SE CONSERVAN (catálogos + sistema):
 *  Config, Log, Grados, Cargos, Áreas, Especialidades, Subespecialidades,
 *  Credenciales, Capacitaciones, UnidadesInternas, TiposServicio,
 *  EstadosAsistencia, TiposDocumento, Sedes, Permisos, Usuarios.
 */

/**
 * Hojas transaccionales que se limpian en el reset.
 * Cada entrada: { nombre: function }.
 * V2 hojas usan HOJA_V2[key]; v0 hojas usan HOJA[key].
 */
var _HOJAS_TRANSACCIONALES_V34H = [
  // V2
  { nombre: function() { return HOJA_V2.personas; } },
  { nombre: function() { return HOJA_V2.voluntarios; } },
  { nombre: function() { return HOJA_V2.historialGrados; } },
  { nombre: function() { return HOJA_V2.historialCargos; } },
  { nombre: function() { return HOJA_V2.voluntarioEspecialidades; } },
  { nombre: function() { return HOJA_V2.voluntarioCredenciales; } },
  { nombre: function() { return HOJA_V2.voluntarioCapacitaciones; } },
  { nombre: function() { return HOJA_V2.integrantesUnidad; } },
  { nombre: function() { return HOJA_V2.servicios; } },
  { nombre: function() { return HOJA_V2.servicioVoluntarios; } },
  { nombre: function() { return HOJA_V2.asistencia; } },
  { nombre: function() { return HOJA_V2.hojaServicios; } },
  { nombre: function() { return HOJA_V2.anotaciones; } },
  { nombre: function() { return HOJA_V2.documentos; } },
  { nombre: function() { return HOJA_V2.retirosTemporales; } },
  { nombre: function() { return HOJA_V2.devoluciones; } },
  // v0
  { nombre: function() { return HOJA.voluntarios; } },
  { nombre: function() { return HOJA.inventario; } },
  { nombre: function() { return HOJA.entregas; } }
];

/**
 * Crea una pestaña de respaldo con timestamp de las hojas transaccionales.
 * Nombre de la pestaña: "RESPALDO V3.4H YYYY-MM-DD HHmmss".
 * Si la hoja de origen no existe, se omite (no falla).
 */
function _respaldarHojasV34H(ss) {
  var ts = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd HHmmss');
  var nombreRespaldo = 'RESPALDO V3.4H ' + ts;
  var respaldo = ss.insertSheet(nombreRespaldo);
  var copiadas = 0;

  for (var i = 0; i < _HOJAS_TRANSACCIONALES_V34H.length; i++) {
    var nombreHoja = _HOJAS_TRANSACCIONALES_V34H[i].nombre();
    if (!nombreHoja) continue;
    var origen = ss.getSheetByName(nombreHoja);
    if (!origen || origen.getLastRow() < 1) continue;

    var sub = respaldo.getParent().insertSheet(nombreRespaldo + ' — ' + nombreHoja);
    var datos = origen.getDataRange().getValues();
    if (datos.length > 0) {
      sub.getRange(1, 1, datos.length, datos[0].length).setValues(datos);
    }
    copiadas++;
  }

  try { ss.deleteSheet(respaldo); } catch (e) { /* ignore */ }

  return copiadas;
}

/**
 * Limpia el contenido de una hoja transaccional (desde PRIMERA_FILA_DATO)
 * manteniendo los encabezados. Si la hoja no existe, se omite.
 */
function _limpiarHojaTransaccionalV34H(ss, nombreHoja) {
  if (!nombreHoja) return;
  var sh = ss.getSheetByName(nombreHoja);
  if (!sh || sh.getLastRow() < PRIMERA_FILA_DATO) return;
  sh.getRange(PRIMERA_FILA_DATO, 1, sh.getLastRow() - PRIMERA_FILA_DATO + 1, sh.getLastColumn()).clearContent();
}

/**
 * Punto de entrada standalone (Editor → resetYSembrarV34H).
 * 1. Respaldar hojas transaccionales
 * 2. Limpiar hojas transaccionales
 * 3. Ejecutar crearDatosDemoV2() (re-siembra)
 */
function resetYSembrarV34H() {
  var ss = _ss();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(60000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    var copiadas = _respaldarHojasV34H(ss);

    var limpiadas = 0;
    for (var i = 0; i < _HOJAS_TRANSACCIONALES_V34H.length; i++) {
      var nombreHoja = _HOJAS_TRANSACCIONALES_V34H[i].nombre();
      if (!nombreHoja) continue;
      var sh = ss.getSheetByName(nombreHoja);
      if (!sh || sh.getLastRow() < PRIMERA_FILA_DATO) continue;
      _limpiarHojaTransaccionalV34H(ss, nombreHoja);
      limpiadas++;
    }

    var resSeed = crearDatosDemoV2();

    _log(ss, 'Sistema', 'resetYSembrarV34H', 'OK',
      'Respaldo: ' + copiadas + ' hojas | Limpiadas: ' + limpiadas + ' hojas' +
      (resSeed.ok ? ' | Seed: OK (' + (resSeed.data.creados || []).length + ' creados)' : ' | Seed ERROR: ' + (resSeed.error || '')));

    return _resOk({
      respaldo: copiadas,
      limpiadas: limpiadas,
      seed: resSeed
    });
  } finally {
    lock.releaseLock();
  }
}
