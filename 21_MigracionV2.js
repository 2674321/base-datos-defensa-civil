/**
 * 21_MigracionV2.js — Estructura y migración del modelo de datos V2.
 *
 * crearEstructuraV2()    → crea/actualiza TODAS las hojas V2 + siembra catálogos (idempotente).
 *                          Solo AGREGA: no toca las hojas existentes del modelo v0.
 * estadoMigracionV2()    → diagnóstico: esquema, hojas, columnas, faltantes (para Web App y editor).
 * _esquemaV2/_registrarEsquemaV2 → control de versión de esquema (Script Properties).
 * Helpers de tabla V2 (_tablaV2, _insertarFilaV2, _contarFilasV2, _hojaV2) usados por
 * todos los dominios V2 (22_…34_…). Sin lógica de negocio específica.
 *
 * Migración de datos (Voluntarios v0 → Personas+Voluntarios V2, devoluciones):
 * _migrarVoluntariosV2()  → fase 2, idempotente por RUN (nunca duplica Personas).
 * _migrarDevolucionesV2() → fase 9, idempotente por Entrega ID.
 * La hoja "Voluntarios" original se conserva intacta (referencia) — jamás se borra.
 */

// ============ Helpers de tabla V2 (genéricos) ============

/** Devuelve la hoja V2 por nombre o null. */
function _hojaV2(ss, nombre) {
  return ss.getSheetByName(nombre);
}

/**
 * Lee una tabla V2 completa como objetos con claves del mapa COL_*.
 * Los valores son crudos (fechas como serial/texto según la hoja).
 * @return {Array<Object>} filas con id no vacío
 */
function _tablaV2(ss, nombre, colMap, nCols) {
  var sh = _hojaV2(ss, nombre);
  if (!sh) return [];
  var ultima = sh.getLastRow();
  if (ultima < PRIMERA_FILA_DATO) return [];
  var datos = sh.getRange(PRIMERA_FILA_DATO, 1, ultima - PRIMERA_FILA_DATO + 1, nCols).getValues();
  var res = [];
  for (var i = 0; i < datos.length; i++) {
    if (!String(datos[i][0] || '')) continue;
    var o = { fila: PRIMERA_FILA_DATO + i };
    for (var k in colMap) {
      if (colMap.hasOwnProperty(k)) o[k] = datos[i][colMap[k] - 1];
    }
    res.push(o);
  }
  return res;
}

/** Fecha de una celda V2 como texto dd/mm/aaaa ('' si vacía). */
function _fechaV2(v) {
  var d = _parseDate(v);
  return d ? _fmtFecha(d) : '';
}

/**
 * Niveles de una especialidad/subespecialidad (V3.4G): celda con lista
 * separada por ';' → array de strings (vacío si no hay).
 */
function _listaNivelesV2(v) {
  if (v === undefined || v === null) return [];
  var t = String(v);
  var res = [];
  var partes = t.split(';');
  for (var i = 0; i < partes.length; i++) {
    var n = String(partes[i]).trim();
    if (n) res.push(n);
  }
  return res;
}

/**
 * Normaliza niveles a texto '; ' (V3.4G): acepta array o string.
 * Se usa al crear/actualizar catálogos de especialidades/subespecialidades.
 */
function _textoNivelesV2(v) {
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) return _listaNivelesV2(v.join(';')).join('; ');
  return _listaNivelesV2(String(v)).join('; ');
}

/** Busca en una tabla V2 la primera fila que cumpla un predicado. @return {Object|null} */
function _buscarV2(ss, nombre, colMap, nCols, pred) {
  var filas = _tablaV2(ss, nombre, colMap, nCols);
  for (var i = 0; i < filas.length; i++) {
    if (pred(filas[i])) return filas[i];
  }
  return null;
}

/**
 * Inserta una fila en una tabla V2 (con lock). Asigna ID correlativo (maxId+1),
 * fechaRegistro y ultimaActualizacion si el mapa las define.
 * @return {Object} {ok, id, error}
 */
function _insertarFilaV2(ss, nombre, colMap, nCols, fila) {
  var sh = _hojaV2(ss, nombre);
  if (!sh) return _resErr('ESTRUCTURA_NO_CREADA', 'Hoja V2 "' + nombre + '" no existe: ejecuta crearEstructuraV2');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    var ultima = sh.getLastRow();
    var nFilas = Math.max(0, ultima - PRIMERA_FILA_DATO + 1);
    var ids = [];
    if (nFilas > 0) {
      var rango = sh.getRange(PRIMERA_FILA_DATO, 1, nFilas, 1).getValues();
      for (var i = 0; i < rango.length; i++) {
        var v = Number(rango[i][0]);
        if (v) ids.push(v);
      }
    }
    var nextId = ids.length ? Math.max.apply(Math, ids) + 1 : 1;
    var celda = [];
    for (var j = 0; j < nCols; j++) celda.push(null);
    for (var k in colMap) {
      if (!colMap.hasOwnProperty(k)) continue;
      var col = colMap[k];
      if (col > nCols) continue;
      if (k === 'id') { celda[col - 1] = nextId; continue; }
      // Acepta clave por nombre (fila.personaId) y por columna (fila[2]).
      var val = fila[k] !== undefined ? fila[k] : fila[String(col)];
      if (k === 'fechaRegistro' || k === 'ultimaActualizacion') {
        if (val === undefined) celda[col - 1] = new Date();
        else celda[col - 1] = val;
        continue;
      }
      celda[col - 1] = val === undefined || val === null ? '' : val;
    }
    var filaDestino = Math.max(PRIMERA_FILA_DATO, ultima + 1);
    sh.getRange(filaDestino, 1, 1, nCols).setValues([celda]);
    return _resOk({ id: nextId });
  } finally {
    lock.releaseLock();
  }
}

/** Actualiza campos de una fila V2 por su id (batch de 1 fila). @return {Object} {ok, sinCambios} */
function _actualizarFilaV2(ss, nombre, colMap, nCols, id, cambios) {
  var sh = _hojaV2(ss, nombre);
  if (!sh) return _resErr('ESTRUCTURA_NO_CREADA', 'Hoja V2 "' + nombre + '" no existe');
  var filaN = _filaPorIdEn(sh, id);
  if (!filaN) return _resErr('NO_ENCONTRADO', 'Registro ' + id + ' no existe en ' + nombre);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    var filaActual = sh.getRange(filaN, 1, 1, nCols).getValues()[0];
    var aplicados = 0;
    for (var k in colMap) {
      if (!colMap.hasOwnProperty(k)) continue;
      var col = colMap[k];
      if (col > nCols) continue;
      if (k === 'id') continue;
      // Solo aplica campos provistos; acepta clave por nombre (cambios.estado)
      // o por columna (cambios[4]) — nunca toca columnas ausentes.
      var provisto = cambios.hasOwnProperty(k) ? k : (cambios.hasOwnProperty(String(col)) ? String(col) : null);
      if (provisto === null) continue;
      var v = cambios[provisto];
      if (v === null || v === undefined) v = '';
      if (String(filaActual[col - 1] || '') === String(v) && (k !== 'ultimaActualizacion')) continue;
      filaActual[col - 1] = v;
      aplicados++;
    }
    if (aplicados === 0 && colMap.ultimaActualizacion) return _resOk({ id: id, sinCambios: true });
    if (colMap.ultimaActualizacion) filaActual[colMap.ultimaActualizacion - 1] = new Date();
    sh.getRange(filaN, 1, 1, nCols).setValues([filaActual]);
    return _resOk({ id: id });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Cierre lógico genérico V3.3 (INTEGRIDAD HISTÓRICA): NUNCA elimina la fila;
 * marca el registro como no vigente (activo=false o estado de cierre) y registra
 * el motivo concatenado en observaciones (solo si no está ya registrado).
 * Idempotente: una 2ª ejecución no duplica texto ni cambia datos históricos.
 * @param {Object} datos {motivo?, observaciones?} — opcionales y compatibles
 * @param {String} campoCierre clave de colMap que recibe el valor de cierre
 * @param {*} valorCierre valor de cierre (ej. false o 'Retirado')
 * @param {String} etiquetaCierre texto marcador para observaciones (ej. 'Cierre (V3.3)')
 * @return {Object} {ok, data:{id, yaCerrado}} | {ok:false, error}
 */
function _cerrarFilaV2(ss, nombre, colMap, nCols, id, datos, campoCierre, valorCierre, etiquetaCierre) {
  datos = datos || {};
  var sh = _hojaV2(ss, nombre);
  if (!sh) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura V2 no creada');
  var filaN = _filaPorIdEn(sh, id);
  if (!filaN) return _resErr('NO_ENCONTRADO', 'Registro ' + id + ' no existe en ' + nombre);
  var filaActual = sh.getRange(filaN, 1, 1, nCols).getValues()[0];
  var valorActual = filaActual[colMap[campoCierre] - 1];
  var yaCerrado = valorActual === valorCierre || String(valorActual) === String(valorCierre);
  var cambios = {};
  cambios[String(colMap[campoCierre])] = valorCierre;
  if (colMap.observaciones) {
    var obs = String(filaActual[colMap.observaciones - 1] || '');
    var nota = etiquetaCierre + (_texto(datos.motivo) ? ': ' + _texto(datos.motivo) : '');
    if (obs.indexOf(etiquetaCierre) === -1) {
      cambios[String(colMap.observaciones)] = obs ? obs + ' | ' + nota : nota;
    }
  }
  var res = _actualizarFilaV2(ss, nombre, colMap, nCols, id, cambios);
  if (!res.ok) return res;
  var registro = {};
  var filaPost = sh.getRange(filaN, 1, 1, nCols).getValues()[0];
  for (var k in colMap) {
    if (colMap.hasOwnProperty(k)) registro[k] = filaPost[colMap[k] - 1];
  }
  return _resOk({ id: id, yaCerrado: yaCerrado, registro: registro });
}

// ============ Control de esquema ============

function _esquemaV2Actual() {
  try {
    return String(PropertiesService.getScriptProperties().getProperty(CLAVE_ESQUEMA) || '');
  } catch (e) {
    return '';
  }
}

function _registrarEsquemaV2() {
  try {
    PropertiesService.getScriptProperties().setProperty(CLAVE_ESQUEMA, ESQUEMA_V2);
  } catch (e) {}
}

// ============ Estructura V2 ============

/** Definición de hojas V2: nombre → {encabezados, nCols, semilla?} */
function _definicionHojasV2() {
  return {
    sedes: { encabezados: ENCABEZADOS_SEDE, n: N_COLS_SEDE },
    personas: { encabezados: ENCABEZADOS_PERSONA, n: N_COLS_PERSONA },
    voluntarios: { encabezados: ENCABEZADOS_VOLUNTARIO_V2, n: N_COLS_VOLUNTARIO_V2 },
    grados: { encabezados: ENCABEZADOS_GRADO, n: N_COLS_GRADO, semilla: '_sembrarGradosV2' },
    historialGrados: { encabezados: ENCABEZADOS_HIST_GRADO, n: N_COLS_HIST_GRADO },
    cargos: { encabezados: ENCABEZADOS_CARGO, n: N_COLS_CARGO, semilla: '_sembrarCargosV2' },
    historialCargos: { encabezados: ENCABEZADOS_HIST_CARGO, n: N_COLS_HIST_CARGO },
    areas: { encabezados: ENCABEZADOS_AREA, n: N_COLS_AREA, semilla: '_sembrarAreasV2' },
    especialidades: { encabezados: ENCABEZADOS_ESPECIALIDAD, n: N_COLS_ESPECIALIDAD, semilla: '_sembrarEspecialidadesV2' },
    subespecialidades: { encabezados: ENCABEZADOS_SUBESPECIALIDAD, n: N_COLS_SUBESPECIALIDAD, semilla: '_sembrarSubespecialidadesV2' },
    voluntarioEspecialidades: { encabezados: ENCABEZADOS_VOL_ESPECIALIDAD, n: N_COLS_VOL_ESPECIALIDAD },
    credenciales: { encabezados: ENCABEZADOS_CREDENCIAL, n: N_COLS_CREDENCIAL },
    voluntarioCredenciales: { encabezados: ENCABEZADOS_VOL_CREDENCIAL, n: N_COLS_VOL_CREDENCIAL },
    capacitaciones: { encabezados: ENCABEZADOS_CAPACITACION, n: N_COLS_CAPACITACION },
    voluntarioCapacitaciones: { encabezados: ENCABEZADOS_VOL_CAPACITACION, n: N_COLS_VOL_CAPACITACION },
    unidadesInternas: { encabezados: ENCABEZADOS_UNIDAD, n: N_COLS_UNIDAD, semilla: '_sembrarUnidadesV2' },
    integrantesUnidad: { encabezados: ENCABEZADOS_INTEGRANTE_UNIDAD, n: N_COLS_INTEGRANTE_UNIDAD },
    servicios: { encabezados: ENCABEZADOS_SERVICIO, n: N_COLS_SERVICIO },
    servicioVoluntarios: { encabezados: ENCABEZADOS_SERVICIO_VOLUNTARIO, n: N_COLS_SERVICIO_VOLUNTARIO },
    asistencia: { encabezados: ENCABEZADOS_ASISTENCIA, n: N_COLS_ASISTENCIA },
    hojaServicios: { encabezados: ENCABEZADOS_HOJA_SERVICIOS, n: N_COLS_HOJA_SERVICIOS },
    retirosTemporales: { encabezados: ENCABEZADOS_RETIRO_TEMPORAL, n: N_COLS_RETIRO_TEMPORAL },
    anotaciones: { encabezados: ENCABEZADOS_ANOTACION, n: N_COLS_ANOTACION },
    documentos: { encabezados: ENCABEZADOS_DOCUMENTO, n: N_COLS_DOCUMENTO },
    devoluciones: { encabezados: ENCABEZADOS_DEVOLUCION, n: N_COLS_DEVOLUCION },
    tiposServicio: { encabezados: ENCABEZADOS_CATALOGO_LISTA, n: N_COLS_CATALOGO_LISTA, lista: TIPOS_SERVICIO_V2, origen: 'CONFIGURABLE' },
    estadosAsistencia: { encabezados: ENCABEZADOS_CATALOGO_LISTA, n: N_COLS_CATALOGO_LISTA, lista: ESTADOS_ASISTENCIA_V2, origen: 'CONFIGURABLE' },
    tiposDocumento: { encabezados: ENCABEZADOS_CATALOGO_LISTA, n: N_COLS_CATALOGO_LISTA, lista: TIPOS_DOCUMENTO_V2, origen: 'CONFIGURABLE' },
    usuarios: { encabezados: ENCABEZADOS_USUARIO, n: N_COLS_USUARIO },
    permisos: { encabezados: ENCABEZADOS_PERMISO, n: N_COLS_PERMISO }
  };
}

/** Crea/actualiza una hoja V2 (encabezados si está vacía) + formateo. Idempotente. */
function _crearHojaV2(ss, nombre, encabezados, nCols) {
  var sh = ss.getSheetByName(nombre);
  if (!sh) sh = ss.insertSheet(nombre);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, nCols).setValues([encabezados]);
    sh.setFrozenRows(1);
  }
  sh.getRange(1, 1, 1, nCols)
    .setFontWeight('bold')
    .setBackground(COLOR.encabezado)
    .setFontColor(COLOR.encabezadoTexto)
    .setVerticalAlignment('middle');
  return sh;
}

/**
 * Migración de columnas idempotente (V3.3): agrega SOLO las columnas faltantes
 * al final de la tabla (nunca elimina ni reordena). Conserva todas las filas y
 * el contenido histórico. Ejecutable múltiples veces sin duplicar columnas.
 * @return {Object} {ok, agregadas}
 */
function _migrarColumnasV2(ss, nombre, encabezados, nCols) {
  var sh = _hojaV2(ss, nombre);
  if (!sh) return _resErr('ESTRUCTURA_NO_CREADA', 'Hoja V2 "' + nombre + '" no existe');
  var nActual = sh.getLastColumn();
  if (nActual >= nCols) return { ok: true, agregadas: 0 };
  var faltantes = nCols - nActual;
  sh.insertColumnsAfter(nActual, faltantes);
  sh.getRange(1, nActual + 1, 1, faltantes).setValues([encabezados.slice(nActual)]);
  sh.getRange(1, nActual + 1, 1, faltantes)
    .setFontWeight('bold')
    .setBackground(COLOR.encabezado)
    .setFontColor(COLOR.encabezadoTexto)
    .setVerticalAlignment('middle');
  return { ok: true, agregadas: faltantes };
}

/** Crea/actualiza todas las hojas V2 + semillas. Idempotente. @return {Object} resumen */
function crearEstructuraV2() {
  var ss = _ss();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    var def = _definicionHojasV2();
    var creadas = [];
    var sembradas = [];
    var migradas = [];
    for (var key in def) {
      if (!def.hasOwnProperty(key)) continue;
      var d = def[key];
      var nombre = HOJA_V2[key];
      var sh = _crearHojaV2(ss, nombre, d.encabezados, d.n);
      creadas.push(nombre);
      // V3.3: agrega columnas faltantes (ej. Activo) sin tocar filas existentes.
      var mig = _migrarColumnasV2(ss, nombre, d.encabezados, d.n);
      if (mig && mig.ok && mig.agregadas) migradas.push(nombre + ' (+' + mig.agregadas + ')');
      var sembrador = {
        grados: _sembrarGradosV2,
        cargos: _sembrarCargosV2,
        areas: _sembrarAreasV2,
        especialidades: _sembrarEspecialidadesV2,
        subespecialidades: _sembrarSubespecialidadesV2,
        unidadesInternas: _sembrarUnidadesV2
      }[key];
      if (sembrador) {
        var res = sembrador(ss, sh);
        if (res && res.sembradas) sembradas.push(res.sembradas);
      }
      if (d.lista && d.lista.length) {
        var nSembradas = _sembrarListaV2(ss, sh, d.lista, d.origen);
        if (nSembradas) sembradas.push(nombre + ' (' + nSembradas + ')');
      }
    }
    _registrarEsquemaV2();
    var sinc = _sincronizarCatalogosV2(ss);
    var rep = _repararCatalogosV2(ss);
    // V3.4J: la migración V3.4D quedó comentada como historial en 38_Migraciones.js
    // (reordenamiento V3.4H) y ya se aplicó en producción — se devuelve el resultado
    // vacío para conservar el contrato del log/retorno sin referenciar código eliminado.
    var mig34 = { creados: [], omitidos: [], detalles: [] };
    _log(ss, 'Sistema', 'crearEstructuraV2', 'OK', 'esquema ' + ESQUEMA_V2 + ' — ' + creadas.length + ' hojas, semillas: ' + (sembradas.length ? sembradas.join(', ') : 'ninguna') + (migradas.length ? '; columnas V3.3: ' + migradas.join(', ') : '') + (sinc.resumen !== 'sin cambios' ? '; V3.1: ' + sinc.resumen : '') + (rep.resumen ? '; reparación V3.2: ' + rep.resumen : '') + (mig34.creados.length ? '; V3.4D: ' + mig34.creados.join(' | ') : ''));
    return _resOk({ esquema: ESQUEMA_V2, hojas: creadas.length, sembradas: sembradas, migradasV33: migradas, sincronizacionV31: sinc, reparacion: rep, migracionesV34D: mig34 });
  } finally {
    lock.releaseLock();
  }
}

/** Siembra una lista de catálogo (solo si la hoja está vacía). @return {Number} filas sembradas */
function _sembrarListaV2(ss, sh, lista, origen) {
  if (sh.getLastRow() > 1) return 0;
  var filas = [];
  for (var i = 0; i < lista.length; i++) {
    filas.push([i + 1, lista[i], origen || 'CONFIGURABLE', true, '']);
  }
  if (filas.length) sh.getRange(PRIMERA_FILA_DATO, 1, filas.length, N_COLS_CATALOGO_LISTA).setValues(filas);
  return filas.length;
}

function _sembrarGradosV2(ss, sh) {
  if (sh.getLastRow() > 1) return {};
  var filas = [];
  for (var i = 0; i < GRADOS_V2.length; i++) {
    var g = GRADOS_V2[i];
    filas.push([i + 1, g[0], g[1], g[2], g[3], g[4], g[5]]);
  }
  sh.getRange(PRIMERA_FILA_DATO, 1, filas.length, N_COLS_GRADO).setValues(filas);
  return { sembradas: 'Grados (' + filas.length + ')' };
}

// ============ Sincronización de catálogos (V3.1) ============
// Alinea la hoja con la semilla SIN perder datos: los grados que ya no están en la
// semilla se eliminan solo si no tienen referencias históricas; si tienen, se
// desactivan (activo=false) dejando constancia. Idempotente: re-ejecutable sin
// duplicar ni alterar información válida.

/** @return {Boolean} celda activo interpretada como verdadero (catálogos) */
function _activoV2(v) {
  return v === true || String(v).toLowerCase() === 'true' || String(v) === 'TRUE' || String(v) === '1';
}

/**
 * V3.3 (INTEGRIDAD HISTÓRICA): celda activo interpretada como "vigente".
 * vacío = vigente (compatibilidad con filas históricas); solo el valor
 * explícito false/'false' marca un cierre lógico.
 */
function _vigenteV2(v) {
  return !(v === false || String(v).toLowerCase() === 'false');
}

/** Sincroniza la hoja Grados con GRADOS_V2. @return {Object} {eliminados, desactivados, agregados} */
function _sincronizarGradosV2(ss, sh) {
  var resumen = { eliminados: 0, desactivados: 0, agregados: 0 };
  if (!sh) return resumen;
  var filas = _tablaV2(ss, sh.getName(), COL_GRADO, N_COLS_GRADO);
  if (!filas.length) return resumen;
  var vigentes = {};
  for (var i = 0; i < GRADOS_V2.length; i++) vigentes[String(GRADOS_V2[i][0]).toLowerCase().trim()] = true;
  var refs = {};
  var hist = _tablaV2(ss, HOJA_V2.historialGrados, COL_HIST_GRADO, N_COLS_HIST_GRADO);
  for (var h = 0; h < hist.length; h++) {
    if (String(hist[h].gradoId || '')) refs[String(hist[h].gradoId)] = true;
  }
  var porEliminar = [];
  for (var j = 0; j < filas.length; j++) {
    var f = filas[j];
    var nombre = String(f.nombre || '').toLowerCase().trim();
    if (!nombre || vigentes[nombre]) continue;
    if (refs[String(f.id)]) {
      if (_activoV2(f.activo)) {
        sh.getRange(f.fila, COL_GRADO.activo).setValue(false);
        sh.getRange(f.fila, COL_GRADO.observaciones).setValue('Excluido del catálogo de grados (V3.1) — conservado por referencias históricas');
        resumen.desactivados++;
      }
    } else {
      porEliminar.push(f.fila);
    }
  }
  for (var k = porEliminar.length - 1; k >= 0; k--) {
    sh.deleteRow(porEliminar[k]);
    resumen.eliminados++;
  }
  var existentes = {};
  var maxId = 0;
  for (var m = 0; m < filas.length; m++) {
    existentes[String(filas[m].nombre || '').toLowerCase().trim()] = true;
    if (Number(filas[m].id) > maxId) maxId = Number(filas[m].id);
  }
  var nuevas = [];
  for (var o = 0; o < GRADOS_V2.length; o++) {
    var g = GRADOS_V2[o];
    if (existentes[String(g[0]).toLowerCase().trim()]) continue;
    nuevas.push([maxId + o + 1, g[0], g[1], g[2], g[3], g[4], g[5]]);
  }
  if (nuevas.length) {
    sh.getRange(sh.getLastRow() + 1, 1, nuevas.length, N_COLS_GRADO).setValues(nuevas);
    resumen.agregados = nuevas.length;
  }
  return resumen;
}

/**
 * Sincroniza CATEGORIAS en Config solo si el valor actual es el default anterior
 * ('Aspirante,Voluntario'). Si la sede lo personalizó, NO lo sobrescribe y lo reporta.
 * @return {Object} {actualizado, personalizado}
 */
function _sincronizarConfigV2(ss) {
  var resumen = { actualizado: false, personalizado: null };
  var sh = _hojaV2(ss, 'Config');
  if (!sh || sh.getLastRow() < 2) return resumen;
  var datos = sh.getRange(1, 1, sh.getLastRow(), 2).getValues();
  var defaultAnterior = 'Aspirante,Voluntario';
  var nuevoDefault = 'Aspirante,Disponible,Voluntario,Reserva';
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][0] || '').toUpperCase() !== 'CATEGORIAS') continue;
    var valor = String(datos[i][1] || '').trim();
    if (valor === nuevoDefault) return resumen;
    if (valor === defaultAnterior) {
      sh.getRange(i + 1, 2).setValue(nuevoDefault);
      resumen.actualizado = true;
    } else {
      resumen.personalizado = valor;
    }
    break;
  }
  return resumen;
}

/**
 * Coordinador V3.1 de sincronización de catálogos (invocado por crearEstructuraV2):
 * ejecuta _sincronizarGradosV2 + _sincronizarConfigV2 y resume el resultado.
 * Reutiliza las funciones existentes; no duplica lógica.
 * @return {Object} {eliminados, desactivados, agregados, configActualizada, configPersonalizada, resumen}
 */
function _sincronizarCatalogosV2(ss) {
  var grados = _sincronizarGradosV2(ss, _hojaV2(ss, HOJA_V2.grados));
  var config = _sincronizarConfigV2(ss);
  var partes = [];
  if (grados.eliminados) partes.push(grados.eliminados + ' eliminados');
  if (grados.desactivados) partes.push(grados.desactivados + ' desactivados');
  if (grados.agregados) partes.push(grados.agregados + ' agregados');
  if (config.actualizado) partes.push('CATEGORIAS actualizada');
  if (config.personalizado) partes.push('CATEGORIAS personalizada respetada');
  return {
    eliminados: grados.eliminados,
    desactivados: grados.desactivados,
    agregados: grados.agregados,
    configActualizada: config.actualizado,
    configPersonalizada: config.personalizado,
    resumen: partes.length ? partes.join(', ') : 'sin cambios'
  };
}

// ============ Reparación estructural de catálogos (V3.2) ============
// Los catálogos sembrados en esquemas 1.0/1.1 se escribieron en la fila 2, pero las
// lecturas usan PRIMERA_FILA_DATO (3): el primer registro quedaba invisible y la
// sincronización V3.1 pudo agregar un duplicado (ej. 'Comandante Local' id 7 en Grados).
// Esta reparación: (1) mueve la fila 2 a PRIMERA_FILA_DATO cuando hay un artefacto de
// siembra; (2) elimina duplicados por id y por nombre conservando la primera aparición
// (si el duplicado tiene referencias, se desactiva en vez de eliminar). Idempotente y
// sin pérdida de datos: solo elimina registros de catálogo sin referencias.

/** @return {Number} columnas de una tabla V2 (solo las usadas como referencia) */
function _nColsRef(nombre) {
  var n = {
    'Historial Grados': N_COLS_HIST_GRADO,
    'Historial Cargos': N_COLS_HIST_CARGO,
    'Cargos': N_COLS_CARGO,
    'Especialidades': N_COLS_ESPECIALIDAD,
    'Subespecialidades': N_COLS_SUBESPECIALIDAD,
    'Voluntario Especialidades': N_COLS_VOL_ESPECIALIDAD,
    'Integrantes Unidad': N_COLS_INTEGRANTE_UNIDAD,
    'Servicios': N_COLS_SERVICIO
  }[nombre];
  return n || 0;
}

/**
 * Revisa si un id de catálogo tiene referencias en las tablas que lo usan.
 * @param {Object} ss spreadsheet
 * @param {String} nombre clave de HOJA_V2 del catálogo
 * @param {String|Number} id id a consultar
 * @return {Boolean} true si hay al menos una referencia
 */
function _hayReferenciasV2(ss, nombre, id) {
  var map = {
    grados: [{ h: HOJA_V2.historialGrados, cm: COL_HIST_GRADO, k: 'gradoId' }],
    cargos: [{ h: HOJA_V2.historialCargos, cm: COL_HIST_CARGO, k: 'cargoId' }],
    areas: [{ h: HOJA_V2.cargos, cm: COL_CARGO, k: 'areaId' }, { h: HOJA_V2.especialidades, cm: COL_ESPECIALIDAD, k: 'areaId' }],
    especialidades: [{ h: HOJA_V2.subespecialidades, cm: COL_SUBESPECIALIDAD, k: 'especialidadId' }, { h: HOJA_V2.voluntarioEspecialidades, cm: COL_VOL_ESPECIALIDAD, k: 'especialidadId' }],
    subespecialidades: [{ h: HOJA_V2.voluntarioEspecialidades, cm: COL_VOL_ESPECIALIDAD, k: 'subespecialidadId' }],
    unidadesInternas: [{ h: HOJA_V2.integrantesUnidad, cm: COL_INTEGRANTE_UNIDAD, k: 'unidadId' }],
    tiposServicio: [{ h: HOJA_V2.servicios, cm: COL_SERVICIO, k: 'tipoServicioId' }],
    estadosAsistencia: [],
    tiposDocumento: []
  }[nombre] || [];
  for (var m = 0; m < map.length; m++) {
    var t = map[m];
    var filas = _tablaV2(ss, t.h, t.cm, _nColsRef(t.h));
    for (var f = 0; f < filas.length; f++) {
      if (String(filas[f][t.k] || '') === String(id)) return true;
    }
  }
  return false;
}

/**
 * Repara catálogos sembrados con el defecto de la fila 2 (V3.2). Idempotente.
 * @return {Object} {porHoja, resumen}
 */
function _repararCatalogosV2(ss) {
  var catalogo = [
    { key: 'grados', col: COL_GRADO, n: N_COLS_GRADO, porNombre: true },
    { key: 'cargos', col: COL_CARGO, n: N_COLS_CARGO, porNombre: false },
    { key: 'areas', col: COL_AREA, n: N_COLS_AREA, porNombre: false },
    { key: 'especialidades', col: COL_ESPECIALIDAD, n: N_COLS_ESPECIALIDAD, porNombre: false },
    { key: 'subespecialidades', col: COL_SUBESPECIALIDAD, n: N_COLS_SUBESPECIALIDAD, porNombre: false },
    { key: 'unidadesInternas', col: COL_UNIDAD, n: N_COLS_UNIDAD, porNombre: false },
    { key: 'tiposServicio', col: COL_CATALOGO_LISTA, n: N_COLS_CATALOGO_LISTA, porNombre: false },
    { key: 'estadosAsistencia', col: COL_CATALOGO_LISTA, n: N_COLS_CATALOGO_LISTA, porNombre: false },
    { key: 'tiposDocumento', col: COL_CATALOGO_LISTA, n: N_COLS_CATALOGO_LISTA, porNombre: false }
  ];
  var total = { movidasFila2: 0, eliminados: 0, desactivados: 0 };
  var porHoja = [];
  for (var c = 0; c < catalogo.length; c++) {
    var def = catalogo[c];
    var sh = _hojaV2(ss, HOJA_V2[def.key]);
    if (!sh) continue;
    var r = _repararCatalogoV2(ss, sh, def);
    porHoja.push(r);
    total.movidasFila2 += r.movidasFila2;
    total.eliminados += r.eliminados;
    total.desactivados += r.desactivados;
  }
  var resumen = [];
  for (var p = 0; p < porHoja.length; p++) {
    var x = porHoja[p];
    if (x.movidasFila2 || x.eliminados || x.desactivados) {
      resumen.push(HOJA_V2[x.key] + ' (fila2:' + x.movidasFila2 + ', elim:' + x.eliminados + ', desact:' + x.desactivados + ')');
    }
  }
  return { porHoja: porHoja, resumen: resumen.length ? resumen.join('; ') : 'sin cambios' };
}

/** Repara un catálogo individual. @return {Object} {key, movidasFila2, eliminados, desactivados} */
function _repararCatalogoV2(ss, sh, def) {
  var out = { key: def.key, movidasFila2: 0, eliminados: 0, desactivados: 0 };
  if (sh.getLastRow() < 2) return out;

  // 1) Si la fila 2 contiene un artefacto de siembra (id numérico), insertar una
  //    fila vacía arriba: el artefacto queda desplazado a PRIMERA_FILA_DATO sin
  //    sobrescribir filas existentes (idempotente: en 2ª pasada la fila 2 está vacía).
  var fila2 = sh.getRange(2, 1, 1, def.n).getValues()[0];
  if (PRIMERA_FILA_DATO > 2 && Number(fila2[0]) > 0) {
    sh.insertRowAfter(PRIMERA_FILA_DATO - 2);
    out.movidasFila2 = 1;
  }

  // 2) Deduplicar por id y (opcional) por nombre, conservando la primera aparición.
  var ultima = sh.getLastRow();
  if (ultima < PRIMERA_FILA_DATO) return out;
  var filas = sh.getRange(PRIMERA_FILA_DATO, 1, ultima - PRIMERA_FILA_DATO + 1, def.n).getValues();
  var vistosId = {};
  var vistosNombre = {};
  var porEliminar = [];
  var porDesactivar = [];
  for (var i = 0; i < filas.length; i++) {
    var f = filas[i];
    var id = Number(f[0]);
    if (!id) continue;
    var claveId = String(id);
    if (vistosId[claveId]) {
      if (_hayReferenciasV2(ss, def.key, id)) porDesactivar.push(i);
      else porEliminar.push(i);
      continue;
    }
    vistosId[claveId] = true;
    if (def.porNombre) {
      var nombre = String(f[1] || '').toLowerCase().trim();
      if (!nombre) continue;
      if (vistosNombre[nombre]) {
        if (_hayReferenciasV2(ss, def.key, id)) porDesactivar.push(i);
        else porEliminar.push(i);
        continue;
      }
      vistosNombre[nombre] = true;
    }
  }
  // Desactivar antes de eliminar (evita colisiones de fila). Idempotente: si la
  // fila ya está inactiva (pasada anterior), no se re-escribe ni se vuelve a contar.
  for (var d = 0; d < porDesactivar.length; d++) {
    var filaD = PRIMERA_FILA_DATO + porDesactivar[d];
    var filaActual = sh.getRange(filaD, 1, 1, def.n).getValues()[0];
    if (!_activoV2(filaActual[def.col.activo - 1])) continue;
    sh.getRange(filaD, def.col.activo).setValue(false);
    if (def.col.observaciones) sh.getRange(filaD, def.col.observaciones).setValue('Duplicado detectado (V3.2) — conservado por referencias');
    out.desactivados++;
  }
  for (var e = porEliminar.length - 1; e >= 0; e--) {
    sh.deleteRow(PRIMERA_FILA_DATO + porEliminar[e]);
    out.eliminados++;
  }
  return out;
}


function _sembrarAreasV2(ss, sh) {
  if (sh.getLastRow() > 1) return {};
  var filas = [];
  for (var i = 0; i < AREAS_V2.length; i++) {
    var a = AREAS_V2[i];
    filas.push([i + 1, a[0], a[1], '', '', a[2], a[3], '']);
  }
  sh.getRange(PRIMERA_FILA_DATO, 1, filas.length, N_COLS_AREA).setValues(filas);
  return { sembradas: 'Áreas (' + filas.length + ')' };
}

function _sembrarCargosV2(ss, sh) {
  if (sh.getLastRow() > 1) return {};
  var areas = _tablaV2(ss, HOJA_V2.areas, COL_AREA, N_COLS_AREA);
  var porNombre = {};
  for (var i = 0; i < areas.length; i++) porNombre[String(areas[i].nombre).trim()] = areas[i].id;
  var filas = [];
  for (var j = 0; j < CARGOS_V2.length; j++) {
    var c = CARGOS_V2[j];
    var areaId = porNombre[c[1]] || '';
    filas.push([j + 1, c[0], areaId, c[2], c[3], c[4], c[5], '']);
  }
  sh.getRange(PRIMERA_FILA_DATO, 1, filas.length, N_COLS_CARGO).setValues(filas);
  return { sembradas: 'Cargos (' + filas.length + ')' };
}

function _sembrarEspecialidadesV2(ss, sh) {
  if (sh.getLastRow() > 1) return {};
  var areas = _tablaV2(ss, HOJA_V2.areas, COL_AREA, N_COLS_AREA);
  var porNombre = {};
  for (var i = 0; i < areas.length; i++) porNombre[String(areas[i].nombre).trim()] = areas[i].id;
  var filas = [];
  for (var j = 0; j < ESPECIALIDADES_V2.length; j++) {
    var e = ESPECIALIDADES_V2[j];
    var areaId = porNombre[e[1]] || '';
    filas.push([j + 1, e[0], areaId, e[2], e[3], e[4], '', e[5] || '']);
  }
  sh.getRange(PRIMERA_FILA_DATO, 1, filas.length, N_COLS_ESPECIALIDAD).setValues(filas);
  return { sembradas: 'Especialidades (' + filas.length + ')' };
}

function _sembrarSubespecialidadesV2(ss, sh) {
  if (sh.getLastRow() > 1) return {};
  var esp = _tablaV2(ss, HOJA_V2.especialidades, COL_ESPECIALIDAD, N_COLS_ESPECIALIDAD);
  var porNombre = {};
  for (var i = 0; i < esp.length; i++) porNombre[String(esp[i].nombre).trim()] = esp[i].id;
  var filas = [];
  for (var j = 0; j < SUBESPECIALIDADES_V2.length; j++) {
    var s = SUBESPECIALIDADES_V2[j];
    var espId = porNombre[s[1]] || '';
    filas.push([j + 1, espId, s[0], '', s[2], s[3], '', s[4] || '']);
  }
  sh.getRange(PRIMERA_FILA_DATO, 1, filas.length, N_COLS_SUBESPECIALIDAD).setValues(filas);
  return { sembradas: 'Subespecialidades (' + filas.length + ')' };
}

function _sembrarUnidadesV2(ss, sh) {
  if (sh.getLastRow() > 1) return {};
  var filas = [];
  for (var i = 0; i < UNIDADES_V2.length; i++) {
    var u = UNIDADES_V2[i];
    filas.push([i + 1, u[0], u[1], u[2], '', null, '', new Date(), new Date()]);
  }
  sh.getRange(PRIMERA_FILA_DATO, 1, filas.length, N_COLS_UNIDAD).setValues(filas);
  return { sembradas: 'Unidades (' + filas.length + ')' };
}

// ============ Diagnóstico ============

/** Estado de la migración V2 (para la Web App y pruebas). Sin escrituras. */
function estadoMigracionV2() {
  try {
    var ss = _ss();
    var def = _definicionHojasV2();
    var hojas = [];
    var faltantes = [];
    for (var key in def) {
      if (!def.hasOwnProperty(key)) continue;
      var d = def[key];
      var sh = ss.getSheetByName(HOJA_V2[key]);
      var info = { nombre: HOJA_V2[key], existe: !!sh, columnas: 0, filas: 0 };
      if (sh) {
        info.columnas = sh.getLastColumn();
        info.filas = Math.max(0, sh.getLastRow() - 1);
        if (info.columnas < d.n) faltantes.push(HOJA_V2[key] + ' (' + info.columnas + '/' + d.n + ')');
      } else {
        faltantes.push(HOJA_V2[key]);
      }
      hojas.push(info);
    }
    return _resOk({
      esquema: _esquemaV2Actual(),
      esperado: ESQUEMA_V2,
      completo: faltantes.length === 0,
      hojas: hojas,
      faltantes: faltantes
    });
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

// ============ Migración de datos (idempotente) ============

/**
 * Migra la hoja "Voluntarios" (v0, 20 columnas) → Personas + Voluntarios V2.
 * Idempotente: se detecta por RUN (Personas). Nunca duplica; nunca borra la hoja original.
 * @return {Object} {ok, data:{creadas, saltadas, errores}}
 */
function _migrarVoluntariosV2() {
  var ss = _ss();
  var shV0 = ss.getSheetByName(HOJA.voluntarios);
  if (!shV0) return _resOk({ creadas: 0, saltadas: 0, errores: 0 });
  var ultima = shV0.getLastRow();
  if (ultima < PRIMERA_FILA_DATO) return _resOk({ creadas: 0, saltadas: 0, errores: 0 });

  var personas = _tablaV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA);
  var runsPersonas = {};
  for (var i = 0; i < personas.length; i++) {
    runsPersonas[_cuerpoRUN(personas[i].run)] = personas[i].id;
  }
  var voluntariosV2 = _tablaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2);
  var vinculados = {};
  for (var v = 0; v < voluntariosV2.length; v++) {
    vinculados[String(voluntariosV2[v].personaId || '')] = true;
  }

  var filas = shV0.getRange(PRIMERA_FILA_DATO, 1, ultima - PRIMERA_FILA_DATO + 1, N_COLS).getValues();
  var creadas = 0;
  var saltadas = 0;
  var errores = 0;

  for (var f = 0; f < filas.length; f++) {
    var r = filas[f];
    if (!String(r[COL.id - 1] || '')) continue;
    var runVal = _validarRUT(r[COL.run - 1]);
    var run = runVal.ok ? runVal.run : String(r[COL.run - 1] || '');
    if (!run) { errores++; continue; }

    var personaId = runsPersonas[_cuerpoRUN(run)];
    var fechaIng = r[COL.fechaIngreso - 1] || new Date();
    var estado = String(r[COL.estado - 1] || '');
    if (!estado) estado = ESTADO_VOLUNTARIO_V2_DEFECTO;

    if (!personaId) {
      var filaPersona = {};
      filaPersona[COL_PERSONA.run] = run;
      filaPersona[COL_PERSONA.nombres] = r[COL.nombres - 1] || '';
      filaPersona[COL_PERSONA.apPaterno] = r[COL.apPaterno - 1] || '';
      filaPersona[COL_PERSONA.apMaterno] = r[COL.apMaterno - 1] || '';
      filaPersona[COL_PERSONA.fechaNac] = r[COL.fechaNac - 1] || null;
      filaPersona[COL_PERSONA.sexo] = r[COL.sexo - 1] || '';
      filaPersona[COL_PERSONA.telefono] = r[COL.telefono - 1] || '';
      filaPersona[COL_PERSONA.correo] = r[COL.correo - 1] || '';
      filaPersona[COL_PERSONA.direccion] = r[COL.direccion - 1] || '';
      filaPersona[COL_PERSONA.comuna] = r[COL.comuna - 1] || '';
      filaPersona[COL_PERSONA.emergenciaNombre] = r[COL.emergenciaNombre - 1] || '';
      filaPersona[COL_PERSONA.emergenciaTelefono] = r[COL.emergenciaTelefono - 1] || '';
      filaPersona[COL_PERSONA.observaciones] = r[COL.observaciones - 1] || '';
      var resP = _insertarFilaV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA, filaPersona);
      if (!resP.ok) { errores++; continue; }
      personaId = resP.data.id;
      runsPersonas[_cuerpoRUN(run)] = personaId;
    }

    if (vinculados[String(personaId)]) { saltadas++; continue; }

    var filaVol = {};
    filaVol[COL_VOLUNTARIO_V2.personaId] = personaId;
    filaVol[COL_VOLUNTARIO_V2.sedeId] = 1;
    filaVol[COL_VOLUNTARIO_V2.estado] = estado;
    filaVol[COL_VOLUNTARIO_V2.categoria] = String(r[COL.categoria - 1] || '') || CATEGORIA_VOLUNTARIO_V2_DEFECTO;
    filaVol[COL_VOLUNTARIO_V2.fechaIngreso] = fechaIng;
    if (estado === 'Egresado') filaVol[COL_VOLUNTARIO_V2.fechaEgreso] = r[COL.ultimaActualizacion - 1] || new Date();
    filaVol[COL_VOLUNTARIO_V2.observaciones] = String(r[COL.cargo - 1] || '') ? 'Cargo v0: ' + r[COL.cargo - 1] : '';
    var resV = _insertarFilaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, filaVol);
    if (!resV.ok) { errores++; continue; }

    _agregarEventoHojaV2(ss, personaId, 'INGRESO', _fechaV2(fechaIng), 'Ingreso migrado desde estructura v0', String(resV.data.id));
    creadas++;
  }

  _log(ss, 'Sistema', '_migrarVoluntariosV2', creadas ? 'OK' : 'SIN CAMBIOS', creadas + ' migradas, ' + saltadas + ' ya vinculadas, ' + errores + ' errores');
  return _resOk({ creadas: creadas, saltadas: saltadas, errores: errores });
}

/**
 * Migra columnas de devolución de Entregas (v0, cols 13–17) → hoja Devoluciones V2.
 * Idempotente por Entrega ID.
 * @return {Object} {ok, data:{creadas, saltadas}}
 */
function _migrarDevolucionesV2() {
  var ss = _ss();
  var shE = ss.getSheetByName(HOJA.entregas);
  if (!shE) return _resOk({ creadas: 0, saltadas: 0 });
  var ultima = shE.getLastRow();
  if (ultima < PRIMERA_FILA_DATO) return _resOk({ creadas: 0, saltadas: 0 });

  var existentes = _tablaV2(ss, HOJA_V2.devoluciones, COL_DEVOLUCION, N_COLS_DEVOLUCION);
  var porEntrega = {};
  for (var i = 0; i < existentes.length; i++) porEntrega[String(existentes[i].entregaId || '')] = true;

  var datos = shE.getRange(PRIMERA_FILA_DATO, 1, ultima - PRIMERA_FILA_DATO + 1, N_COLS_ENTREGA).getValues();
  var creadas = 0;
  var saltadas = 0;
  for (var f = 0; f < datos.length; f++) {
    var r = datos[f];
    if (!String(r[COL_ENTREGA.id - 1] || '')) continue;
    var entregaId = String(r[COL_ENTREGA.id - 1]);
    var devuelta = Number(r[COL_ENTREGA.cantidadDevuelta - 1] || 0);
    var danada = Number(r[COL_ENTREGA.cantidadDanada - 1] || 0);
    var extraviada = Number(r[COL_ENTREGA.cantidadExtraviada - 1] || 0);
    if (!devuelta && !danada && !extraviada) continue;
    if (porEntrega[entregaId]) { saltadas++; continue; }
    var fila = {};
    fila[COL_DEVOLUCION.entregaId] = entregaId;
    fila[COL_DEVOLUCION.fecha] = r[COL_ENTREGA.fechaDevolucion - 1] || new Date();
    fila[COL_DEVOLUCION.cantidadDevuelta] = devuelta || '';
    fila[COL_DEVOLUCION.cantidadDanada] = danada || '';
    fila[COL_DEVOLUCION.cantidadExtraviada] = extraviada || '';
    fila[COL_DEVOLUCION.responsable] = r[COL_ENTREGA.responsable - 1] || '';
    fila[COL_DEVOLUCION.observaciones] = r[COL_ENTREGA.observaciones - 1] || '';
    var res = _insertarFilaV2(ss, HOJA_V2.devoluciones, COL_DEVOLUCION, N_COLS_DEVOLUCION, fila);
    if (res.ok) { creadas++; porEntrega[entregaId] = true; }
  }
  _log(ss, 'Sistema', '_migrarDevolucionesV2', creadas ? 'OK' : 'SIN CAMBIOS', creadas + ' creadas, ' + saltadas + ' ya existentes');
  return _resOk({ creadas: creadas, saltadas: saltadas });
}

/** Evento en la hoja de servicios (solo append; usado por todos los dominios V2). */
function _agregarEventoHojaV2(ss, voluntarioId, tipoEvento, fecha, detalle, referenciaId, quien) {
  var fila = {};
  fila[COL_HOJA_SERVICIOS.voluntarioId] = voluntarioId;
  fila[COL_HOJA_SERVICIOS.tipoEvento] = tipoEvento;
  fila[COL_HOJA_SERVICIOS.fecha] = fecha || _fmtFecha(new Date());
  fila[COL_HOJA_SERVICIOS.detalle] = detalle || '';
  fila[COL_HOJA_SERVICIOS.referenciaId] = referenciaId || '';
  fila[COL_HOJA_SERVICIOS.quienRegistro] = quien || 'Sistema';
  return _insertarFilaV2(ss, HOJA_V2.hojaServicios, COL_HOJA_SERVICIOS, N_COLS_HOJA_SERVICIOS, fila);
}