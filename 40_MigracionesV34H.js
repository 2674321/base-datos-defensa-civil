/**
 * 40_MigracionesV34H.js — V3.4H: respaldo + reset transaccional + re-siembra.
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

/** Normaliza para búsqueda insensible a acentos/mayúsculas. */
function _normV34H(t) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }

/**
 * Hojas transaccionales que se limpian en el reset.
 * Cada entrada: { nombre: string }.
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

    // Crear sub-pestaña en el respaldo con el nombre de la hoja
    var sub = respaldo.getParent().insertSheet(nombreRespaldo + ' — ' + nombreHoja);
    var datos = origen.getDataRange().getValues();
    if (datos.length > 0) {
      sub.getRange(1, 1, datos.length, datos[0].length).setValues(datos);
    }
    copiadas++;
  }

  // Eliminar la pestaña principal del respaldo (solo quedan las sub-pestañas)
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
    // 1. Respaldo
    var copiadas = _respaldarHojasV34H(ss);

    // 2. Limpieza de hojas transaccionales
    var limpiadas = 0;
    for (var i = 0; i < _HOJAS_TRANSACCIONALES_V34H.length; i++) {
      var nombreHoja = _HOJAS_TRANSACCIONALES_V34H[i].nombre();
      if (!nombreHoja) continue;
      var sh = ss.getSheetByName(nombreHoja);
      if (!sh || sh.getLastRow() < PRIMERA_FILA_DATO) continue;
      _limpiarHojaTransaccionalV34H(ss, nombreHoja);
      limpiadas++;
    }

    // 3. Re-siembra
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
