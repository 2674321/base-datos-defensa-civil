/**
 * 29_HojaServicios.js — Dominio Hoja de Servicios (fase 7).
 * Timeline append-only de la vida institucional del voluntario (tipoEvento
 * CONFIGURABLE en TIPOS_EVENTO_HOJA). Anotaciones (Art. 68 ROF-S y notas) y
 * Documentos se anclan al VOLUNTARIO, no al evento.
 * API:
 *   listarEventosVoluntarioV2(voluntarioId)
 *   agregarEventoV2(voluntarioId, datos)
 *   listarAnotacionesVoluntarioV2(voluntarioId) / agregarAnotacionV2(voluntarioId, datos) / quitarAnotacionV2(id)
 *   listarDocumentosVoluntarioV2(voluntarioId) / agregarDocumentoV2(voluntarioId, datos) / quitarDocumentoV2(id)
 */

function listarEventosVoluntarioV2(voluntarioId) {
  try {
    var ss = _ss();
    var filas = _tablaV2(ss, HOJA_V2.hojaServicios, COL_HOJA_SERVICIOS, N_COLS_HOJA_SERVICIOS).filter(function (h) {
      return String(h.voluntarioId) === String(voluntarioId);
    });
    var res = filas.map(function (f) {
      return {
        id: f.id,
        tipo: String(f.tipoEvento || ''),
        fecha: _fechaV2(f.fecha),
        detalle: String(f.detalle || ''),
        referenciaId: String(f.referenciaId || ''),
        quienRegistro: String(f.quienRegistro || '')
      };
    });
    res.sort(function (x, y) { return _parseDate(y.fecha || '01/01/2000') - _parseDate(x.fecha || '01/01/2000'); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function agregarEventoV2(voluntarioId, datos) {
  datos = datos || {};
  var ss = _ss();
  var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
    return String(v.id) === String(voluntarioId);
  });
  if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario ' + voluntarioId + ' no existe');
  var tipo = _texto(datos.tipo);
  if (!tipo) return _resErr('DATOS_INCOMPLETOS', 'Tipo de evento: obligatorio');
  if (TIPOS_EVENTO_HOJA.indexOf(tipo) === -1) return _resErr('VALIDACION', 'Tipo debe ser: ' + TIPOS_EVENTO_HOJA.join(', '));
  var fecha = _texto(datos.fecha) ? _parseDate(datos.fecha) : new Date();
  if (!fecha) return _resErr('VALIDACION', 'Fecha inválida');
  var fila = {};
  fila[COL_HOJA_SERVICIOS.voluntarioId] = voluntarioId;
  fila[COL_HOJA_SERVICIOS.tipoEvento] = tipo;
  fila[COL_HOJA_SERVICIOS.fecha] = fecha;
  fila[COL_HOJA_SERVICIOS.detalle] = _texto(datos.detalle);
  fila[COL_HOJA_SERVICIOS.referenciaId] = _texto(datos.referenciaId);
  fila[COL_HOJA_SERVICIOS.quienRegistro] = _texto(datos.quienRegistro);
  var res = _insertarFilaV2(ss, HOJA_V2.hojaServicios, COL_HOJA_SERVICIOS, N_COLS_HOJA_SERVICIOS, fila);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.hojaServicios, 'agregarEventoV2', 'OK', 'Vol. ' + voluntarioId + ' — ' + tipo);
  return _resOk({ id: res.data.id });
}

// ============ ANOTACIONES (ancladas al voluntario) ============

/**
 * Lista anotaciones de un voluntario (V3.3): vigentes por defecto; con
 * opciones.incluirCerradas=true incluye las desactivadas (activo:false).
 */
function listarAnotacionesVoluntarioV2(voluntarioId, opciones) {
  try {
    var ss = _ss();
    var incluirCerradas = !!(opciones && opciones.incluirCerradas);
    var filas = _tablaV2(ss, HOJA_V2.anotaciones, COL_ANOTACION, N_COLS_ANOTACION).filter(function (a) {
      if (String(a.voluntarioId) !== String(voluntarioId)) return false;
      return incluirCerradas || _vigenteV2(a.activo);
    });
    var res = filas.map(function (a) {
      return {
        id: a.id,
        tipo: String(a.tipo || ''),
        fecha: _fechaV2(a.fecha),
        detalle: String(a.detalle || ''),
        autor: String(a.autor || ''),
        sancion: String(a.sancion || ''),
        vigenciaHasta: _fechaV2(a.vigenciaHasta),
        observaciones: String(a.observaciones || ''),
        activo: _vigenteV2(a.activo)
      };
    });
    res.sort(function (x, y) { return _parseDate(y.fecha || '01/01/2000') - _parseDate(x.fecha || '01/01/2000'); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function agregarAnotacionV2(voluntarioId, datos) {
  datos = datos || {};
  var ss = _ss();
  var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
    return String(v.id) === String(voluntarioId);
  });
  if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario ' + voluntarioId + ' no existe');
  var tipo = _texto(datos.tipo);
  if (!tipo) return _resErr('DATOS_INCOMPLETOS', 'Tipo de anotación: obligatorio');
  if (TIPOS_ANOTACION.indexOf(tipo) === -1) return _resErr('VALIDACION', 'Tipo debe ser: ' + TIPOS_ANOTACION.join(', '));
  var fecha = _texto(datos.fecha) ? _parseDate(datos.fecha) : new Date();
  if (!fecha) return _resErr('VALIDACION', 'Fecha inválida');
  var fila = {};
  fila[COL_ANOTACION.voluntarioId] = voluntarioId;
  fila[COL_ANOTACION.tipo] = tipo;
  fila[COL_ANOTACION.fecha] = fecha;
  fila[COL_ANOTACION.detalle] = _texto(datos.detalle);
  fila[COL_ANOTACION.autor] = _texto(datos.autor);
  fila[COL_ANOTACION.sancion] = _texto(datos.sancion);
  fila[COL_ANOTACION.vigenciaHasta] = _texto(datos.vigenciaHasta) ? _parseDate(datos.vigenciaHasta) : null;
  fila[COL_ANOTACION.observaciones] = _texto(datos.observaciones);
  var res = _insertarFilaV2(ss, HOJA_V2.anotaciones, COL_ANOTACION, N_COLS_ANOTACION, fila);
  if (!res.ok) return res;
  _agregarEventoHojaV2(ss, voluntarioId, 'ANOTACION', _fmtFecha(fecha), tipo + ': ' + _texto(datos.detalle), String(res.data.id));
  _log(ss, HOJA_V2.anotaciones, 'agregarAnotacionV2', 'OK', 'Vol. ' + voluntarioId + ' — ' + tipo);
  return _resOk({ id: res.data.id });
}

/**
 * Desactiva lógicamente una anotación (V3.3): NO elimina la fila (es registro
 * institucional); la marca activo=false y registra el motivo en observaciones.
 * datos: {motivo?} — opcional y compatible con la firma previa (id).
 */
function quitarAnotacionV2(id, datos) {
  var ss = _ss();
  var res = _cerrarFilaV2(ss, HOJA_V2.anotaciones, COL_ANOTACION, N_COLS_ANOTACION, id, datos || {}, 'activo', false, 'Desactivación (V3.3)');
  if (!res.ok) return res;
  _log(ss, HOJA_V2.anotaciones, 'quitarAnotacionV2', 'OK', id + (res.data.yaCerrado ? ' (ya desactivada)' : ''));
  return res;
}

// ============ DOCUMENTOS (anclados al voluntario) ============

/**
 * Lista documentos de un voluntario (V3.3): vigentes por defecto; con
 * opciones.incluirCerradas=true incluye los desactivados (activo:false).
 */
function listarDocumentosVoluntarioV2(voluntarioId, opciones) {
  try {
    var ss = _ss();
    var incluirCerradas = !!(opciones && opciones.incluirCerradas);
    var filas = _tablaV2(ss, HOJA_V2.documentos, COL_DOCUMENTO, N_COLS_DOCUMENTO).filter(function (d) {
      if (String(d.voluntarioId) !== String(voluntarioId)) return false;
      return incluirCerradas || _vigenteV2(d.activo);
    });
    var res = filas.map(function (d) {
      return {
        id: d.id,
        tipo: String(d.tipo || ''),
        fecha: _fechaV2(d.fecha),
        descripcion: String(d.descripcion || ''),
        referencia: String(d.referencia || ''),
        enlace: String(d.enlace || ''),
        observaciones: String(d.observaciones || ''),
        activo: _vigenteV2(d.activo)
      };
    });
    res.sort(function (x, y) { return _parseDate(y.fecha || '01/01/2000') - _parseDate(x.fecha || '01/01/2000'); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function agregarDocumentoV2(voluntarioId, datos) {
  datos = datos || {};
  var ss = _ss();
  var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
    return String(v.id) === String(voluntarioId);
  });
  if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario ' + voluntarioId + ' no existe');
  var tipo = _texto(datos.tipo);
  if (!tipo) return _resErr('DATOS_INCOMPLETOS', 'Tipo de documento: obligatorio');
  if (TIPOS_DOCUMENTO_V2.indexOf(tipo) === -1) return _resErr('VALIDACION', 'Tipo debe ser: ' + TIPOS_DOCUMENTO_V2.join(', '));
  var enlace = _texto(datos.enlace);
  if (enlace && !/^https?:\/\//i.test(enlace)) return _resErr('VALIDACION', 'Enlace debe comenzar con http(s)://');
  var fecha = _texto(datos.fecha) ? _parseDate(datos.fecha) : new Date();
  if (!fecha) return _resErr('VALIDACION', 'Fecha inválida');
  var fila = {};
  fila[COL_DOCUMENTO.voluntarioId] = voluntarioId;
  fila[COL_DOCUMENTO.sedeId] = _texto(datos.sedeId);
  fila[COL_DOCUMENTO.tipo] = tipo;
  fila[COL_DOCUMENTO.fecha] = fecha;
  fila[COL_DOCUMENTO.descripcion] = _texto(datos.descripcion);
  fila[COL_DOCUMENTO.referencia] = _texto(datos.referencia);
  fila[COL_DOCUMENTO.enlace] = enlace;
  fila[COL_DOCUMENTO.observaciones] = _texto(datos.observaciones);
  var res = _insertarFilaV2(ss, HOJA_V2.documentos, COL_DOCUMENTO, N_COLS_DOCUMENTO, fila);
  if (!res.ok) return res;
  _agregarEventoHojaV2(ss, voluntarioId, 'SITUACION_ADMINISTRATIVA', _fmtFecha(fecha), 'Documento: ' + tipo + ' — ' + _texto(datos.descripcion), String(res.data.id));
  _log(ss, HOJA_V2.documentos, 'agregarDocumentoV2', 'OK', 'Vol. ' + voluntarioId + ' — ' + tipo);
  return _resOk({ id: res.data.id });
}

/**
 * Desactiva lógicamente un documento (V3.3): NO elimina la fila (es registro
 * histórico); la marca activo=false y registra el motivo en observaciones.
 * datos: {motivo?} — opcional y compatible con la firma previa (id).
 */
function quitarDocumentoV2(id, datos) {
  var ss = _ss();
  var res = _cerrarFilaV2(ss, HOJA_V2.documentos, COL_DOCUMENTO, N_COLS_DOCUMENTO, id, datos || {}, 'activo', false, 'Desactivación (V3.3)');
  if (!res.ok) return res;
  _log(ss, HOJA_V2.documentos, 'quitarDocumentoV2', 'OK', id + (res.data.yaCerrado ? ' (ya desactivado)' : ''));
  return res;
}