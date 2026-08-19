/**
 * 04_Eventos.js — Triggers simples onEdit con despacho por hoja.
 * Mecanismo AUXILIAR: protección de IDs y columnas de sistema, y validación en
 * vivo (normaliza RUN/nombres, marca datos inválidos en rojo) usando el validador
 * compartido _validarCampoVoluntario (03_Voluntarios.js).
 * La lógica principal del sistema NO depende de estos eventos (ver §11 AGENTS.md).
 */

function onEdit(e) {
  var ss;
  try {
    ss = e.source;
    var sh = e.range.getSheet();
    var nombre = sh.getName();
    if (nombre === HOJA.voluntarios) {
      _onEditVoluntarios(e, ss, sh);
    } else if (nombre === HOJA.catalogo || nombre === HOJA.inventario || nombre === HOJA.entregas) {
      _onEditRegistros(e, ss, sh);
    } else if (nombre === HOJA.config) {
      _onEditConfig(e);
    }
  } catch (err) {
    console.error('onEdit: ' + err);
    if (ss) _log(ss, 'onEdit', 'ERROR', String(err));
  }
}

function _onEditConfig(e) {
  var fila = e.range.getRow();
  var col = e.range.getColumn();
  if (fila === 1) return;
  if (col === 1 || col === 2) _invalidarConfigCache();
}

/** Protección genérica: revierte ediciones manuales de una celda administrada por el backend. */
function _protegerCelda(e, ss, cell, cache, clave, mensaje) {
  var antiguo = e.oldValue;
  if (String(e.value !== undefined ? e.value : cell.getValue()) !== String(antiguo)) {
    cache.put(clave, '1', 30);
    cell.setValue(antiguo !== undefined ? antiguo : '');
    ss.toast(mensaje, '⚠️', 6);
  }
  cell.setBackground(COLOR.normal);
}

/** Hojas de registros (Catálogo/Inventario/Entregas): el ID es automático. */
function _onEditRegistros(e, ss, sh) {
  var fila = e.range.getRow();
  var col = e.range.getColumn();
  if (col !== 1 || fila < PRIMERA_FILA_DATO) return;
  if (e.range.getNumCells() !== 1) return;
  var cache = CacheService.getScriptCache();
  var clave = 'DC_SKIP_' + fila + '_' + col;
  if (cache.get(clave)) {
    cache.remove(clave);
    return;
  }
  _protegerCelda(e, ss, e.range, cache, clave, 'El ID es automático (código interno)');
}

function _onEditVoluntarios(e, ss, sh) {
  var fila = e.range.getRow();
  var col = e.range.getColumn();
  if (fila < 2 || col < 1 || col > N_COLS) return;
  if (e.range.getNumCells() !== 1) return; // pegas multi-celda: no normalizar

  var cache = CacheService.getScriptCache();
  var clave = 'DC_SKIP_' + fila + '_' + col;
  if (cache.get(clave)) {
    cache.remove(clave);
    return;
  }

  var valor = e.value !== undefined ? e.value : e.range.getValue();
  var cell = e.range;

  if (col === COL.id && fila >= PRIMERA_FILA_DATO) {
    _protegerCelda(e, ss, cell, cache, clave, 'El N° es automático (ID interno)');
    return;
  }

  if (COL_SISTEMA_VOLUNTARIOS.indexOf(col) !== -1 && fila >= PRIMERA_FILA_DATO) {
    _protegerCelda(e, ss, cell, cache, clave, 'Campo administrado por el sistema (automático)');
    return;
  }

  var ctx = _contextoListas(ss);
  var r = _validarCampoVoluntario(col, valor, ctx);
  var normalizado = r.normalizado;
  var valido = r.valido;
  var mensaje = r.mensaje;

  if (normalizado !== null && normalizado !== String(valor)) {
    cache.put(clave, '1', 30);
    cell.setValue(normalizado);
    valido = true;
    mensaje = '';
  }

  var fondo = valido ? (fila === FILA_ENTRADA ? COLOR.filaEntrada : COLOR.normal) : COLOR.invalido;
  cell.setBackground(fondo);
  if (!valido && mensaje) {
    ss.toast(mensaje, '⚠️ Dato inválido (' + cell.getA1Notation() + ')', 8);
  }
}