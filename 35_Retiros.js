/**
 * 35_Retiros.js — Retiros temporales y antigüedad (FASE V3.2, esquema 1.2).
 *
 * Reglas del encargo V3.2:
 * - RetirosTemporales = hoja append-only (estados Activo / Finalizado / Anulado).
 *   Sin borrado físico; un retiro abierto (sin fecha de término) es válido.
 * - El documento de respaldo es solo referencia (nunca se copia el archivo).
 * - Durante un retiro Activo, el voluntario pasa a estado "Inactivo" SOLO si estaba
 *   "Activo"; el estado anterior se guarda en el registro y se restaura al
 *   reincorporar o anular (solo si el voluntario sigue en el estado inducido).
 * - La antigüedad es SIEMPRE derivada (nunca se persiste): 3 dimensiones separadas
 *   (institucional, en grado, en cargo), con descuento configurable en Config:
 *   RETIRO_AFECTA_ANTIGUEDAD_{INSTITUCIONAL,GRADO,CARGO} (Si/No).
 * - Eventos de la Hoja de Servicios: RETIRO_TEMPORAL (creación) y REINCORPORACION
 *   (reincorporación); la anulación se registra como SITUACION_ADMINISTRATIVA.
 * - Los retiros Anulados NO descuentan antigüedad.
 *
 * API:
 *   crearRetiroTemporalV2(datos)
 *   reincorporarVoluntarioV2(retiroId, datos)
 *   anularRetiroTemporalV2(retiroId, datos)
 *   listarRetirosTemporalesV2(voluntarioId?)
 *   obtenerAntiguedadV2(voluntarioId)
 *   _calcularAntiguedadV2(input)   — función pura (testeable)
 *   _textoDuracionV2(ms)           — función pura
 */

/** Quién registró: correo de sesión o 'Sistema'. Nunca lanza. */
function _quienRegistro() {
  try {
    var u = Session.getActiveUser();
    return (u && u.getEmail()) || 'Sistema';
  } catch (e) {
    return 'Sistema';
  }
}

/** Lee un parámetro Si/No de Config con default seguro. */
function _configSi(ss, parametro, dflt) {
  try {
    var v = String(_leerConfig(ss, parametro) || '').trim().toLowerCase();
    if (!v) return !!dflt;
    return v === 'si';
  } catch (e) {
    return !!dflt;
  }
}

/** Retiros de un voluntario (tabla completa). */
function _retirosDeV2(ss, voluntarioId) {
  return _tablaV2(ss, HOJA_V2.retirosTemporales, COL_RETIRO_TEMPORAL, N_COLS_RETIRO_TEMPORAL).filter(function (r) {
    return String(r.voluntarioId) === String(voluntarioId);
  });
}

/** Primer retiro Activo de un voluntario (o null). */
function _retiroActivoV2(ss, voluntarioId) {
  var retiros = _retirosDeV2(ss, voluntarioId);
  for (var i = 0; i < retiros.length; i++) {
    if (String(retiros[i].estado || '') === 'Activo') return retiros[i];
  }
  return null;
}

/** Períodos que descuentan antigüedad (Activo o Finalizado; Anulado NO). */
function _periodosDescontablesV2(ss, voluntarioId) {
  var out = [];
  var retiros = _retirosDeV2(ss, voluntarioId);
  for (var i = 0; i < retiros.length; i++) {
    var e = String(retiros[i].estado || '');
    if (e === 'Activo' || e === 'Finalizado') {
      out.push({
        retiroId: retiros[i].id,
        inicio: retiros[i].fechaInicio,
        termino: retiros[i].fechaTermino || null,
        estado: e
      });
    }
  }
  return out;
}

/** Texto "X años, Y meses, Z días" derivado de una duración (nunca se persiste). Puro. */
function _textoDuracionV2(ms) {
  if (!(ms > 0)) return '0 días';
  var DIA = 86400000;
  var ANIO = 365.25 * DIA;
  var MES = ANIO / 12;
  var anios = Math.floor(ms / ANIO);
  var resto = ms - anios * ANIO;
  var meses = Math.floor(resto / MES);
  var dias = Math.max(0, Math.floor((resto - meses * MES) / DIA));
  var partes = [];
  if (anios) partes.push(anios + (anios === 1 ? ' año' : ' años'));
  if (meses) partes.push(meses + (meses === 1 ? ' mes' : ' meses'));
  if (dias) partes.push(dias + (dias === 1 ? ' día' : ' días'));
  return partes.join(', ') || '0 días';
}

/**
 * Calcula una antigüedad neta descontando períodos de retiro. FUNCIÓN PURA.
 * @param {Object} input {desde, hasta?, periodos?, descontar?, hoy?}
 *   desde/hasta: Date o string fecha; periodos: [{inicio, termino|null}];
 *   descontar: Boolean (regla configurable); hoy: Date opcional (default new Date()).
 * @return {Object} {dias, ms, texto, descontado}
 */
function _calcularAntiguedadV2(input) {
  input = input || {};
  var desde = _parseDate(input.desde);
  var hasta = _parseDate(input.hasta) || input.hoy || new Date();
  var descontar = !!input.descontar;
  if (!desde) return { dias: 0, ms: 0, texto: _textoDuracionV2(0), descontado: false };
  var totalMs = hasta.getTime() - desde.getTime();
  if (totalMs < 0) totalMs = 0;
  var restaMs = 0;
  var periodos = input.periodos || [];
  if (descontar) {
    for (var i = 0; i < periodos.length; i++) {
      var pIni = _parseDate(periodos[i].inicio);
      if (!pIni) continue;
      var pFin = _parseDate(periodos[i].termino) || hasta;
      var ini = pIni.getTime() > desde.getTime() ? pIni.getTime() : desde.getTime();
      var fin = pFin.getTime() < hasta.getTime() ? pFin.getTime() : hasta.getTime();
      if (fin > ini) restaMs += fin - ini;
    }
  }
  var netoMs = Math.max(0, totalMs - restaMs);
  return {
    dias: Math.floor(netoMs / 86400000),
    ms: netoMs,
    texto: _textoDuracionV2(netoMs),
    descontado: descontar && restaMs > 0
  };
}

/**
 * Registra un retiro temporal (validaciones + evento Hoja de Servicios + Log).
 * datos: {voluntarioId, sedeId?, fechaInicio?, fechaTermino?, documento?,
 *         documentoFecha?, documentoDescripcion?, motivo, observaciones?, estado?}
 */
function crearRetiroTemporalV2(datos) {
  datos = datos || {};
  var ss = _ss();
  try {
    var voluntarioId = _texto(datos.voluntarioId);
    if (!voluntarioId) return _resErr('DATOS_INCOMPLETOS', 'Indica el voluntarioId');
    var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
      return String(v.id) === String(voluntarioId);
    });
    if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario ' + voluntarioId + ' no existe');

    var motivo = _texto(datos.motivo);
    if (!motivo) return _resErr('VALIDACION', 'Indica el motivo del retiro temporal');

    var fechaInicio = _texto(datos.fechaInicio) ? _parseDate(datos.fechaInicio) : new Date();
    if (!fechaInicio) return _resErr('VALIDACION', 'Fecha de inicio inválida');

    var fechaTermino = _texto(datos.fechaTermino) ? _parseDate(datos.fechaTermino) : null;
    if (_texto(datos.fechaTermino) && !fechaTermino) return _resErr('VALIDACION', 'Fecha de término inválida');
    if (fechaTermino && fechaTermino.getTime() < fechaInicio.getTime()) return _resErr('VALIDACION', 'La fecha de término no puede ser anterior al inicio');

    var documentoFecha = _texto(datos.documentoFecha) ? _parseDate(datos.documentoFecha) : null;
    if (_texto(datos.documentoFecha) && !documentoFecha) return _resErr('VALIDACION', 'Fecha del documento inválida');

    var estado = _texto(datos.estado) || 'Activo';
    if (ESTADOS_RETIRO_TEMPORAL.indexOf(estado) === -1) return _resErr('VALIDACION', 'Estado debe ser: ' + ESTADOS_RETIRO_TEMPORAL.join(', '));

    var estadoAnterior = String(vol.estado || '');
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(8000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
    try {
      if (estado === 'Activo' && _retiroActivoV2(ss, voluntarioId)) {
        return _resErr('VALIDACION', 'El voluntario ya tiene un retiro temporal Activo');
      }
      var fila = {};
      fila[COL_RETIRO_TEMPORAL.voluntarioId] = voluntarioId;
      fila[COL_RETIRO_TEMPORAL.sedeId] = _texto(datos.sedeId) || vol.sedeId || 1;
      fila[COL_RETIRO_TEMPORAL.fechaInicio] = fechaInicio;
      fila[COL_RETIRO_TEMPORAL.fechaTermino] = fechaTermino;
      fila[COL_RETIRO_TEMPORAL.documento] = _texto(datos.documento);
      fila[COL_RETIRO_TEMPORAL.documentoFecha] = documentoFecha;
      fila[COL_RETIRO_TEMPORAL.documentoDescripcion] = _texto(datos.documentoDescripcion);
      fila[COL_RETIRO_TEMPORAL.motivo] = motivo;
      fila[COL_RETIRO_TEMPORAL.observaciones] = _texto(datos.observaciones);
      fila[COL_RETIRO_TEMPORAL.estado] = estado;
      fila[COL_RETIRO_TEMPORAL.estadoAnterior] = estadoAnterior;
      fila[COL_RETIRO_TEMPORAL.registradoPor] = _quienRegistro();
      var res = _insertarFilaV2(ss, HOJA_V2.retirosTemporales, COL_RETIRO_TEMPORAL, N_COLS_RETIRO_TEMPORAL, fila);
      if (!res.ok) return res;
      var quien = _quienRegistro();
      _agregarEventoHojaV2(ss, voluntarioId, 'RETIRO_TEMPORAL', _fmtFecha(fechaInicio), 'Retiro temporal: ' + motivo, String(res.data.id), quien);
      if (estado === 'Activo' && estadoAnterior === 'Activo') {
        _actualizarFilaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, voluntarioId, { estado: 'Inactivo' });
        _agregarEventoHojaV2(ss, voluntarioId, 'SITUACION_ADMINISTRATIVA', _fmtFecha(new Date()), 'Estado → Inactivo (retiro temporal N° ' + res.data.id + ')', String(res.data.id), quien);
      }
      _log(ss, HOJA_V2.retirosTemporales, 'crearRetiroTemporalV2', 'OK', voluntarioId + ' — estado ' + estado);
      return _resOk({ id: res.data.id, estado: estado, estadoAnterior: estadoAnterior });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

/**
 * Reincorpora al voluntario (cierra el retiro). datos: {fechaReincorporacion?, observaciones?}
 * Restaura el estado anterior del voluntario si este sigue en el estado inducido
 * por el retiro ('Inactivo'). Evento REINCORPORACION en la Hoja de Servicios.
 */
function reincorporarVoluntarioV2(retiroId, datos) {
  datos = datos || {};
  var ss = _ss();
  try {
    var retiro = _buscarV2(ss, HOJA_V2.retirosTemporales, COL_RETIRO_TEMPORAL, N_COLS_RETIRO_TEMPORAL, function (r) {
      return String(r.id) === String(retiroId);
    });
    if (!retiro) return _resErr('NO_ENCONTRADO', 'Retiro temporal ' + retiroId + ' no existe');
    if (String(retiro.estado || '') !== 'Activo') return _resErr('VALIDACION', 'Solo un retiro Activo puede reincorporarse');

    var fechaReincorporacion = _texto(datos.fechaReincorporacion) ? _parseDate(datos.fechaReincorporacion) : new Date();
    if (!fechaReincorporacion) return _resErr('VALIDACION', 'Fecha de reincorporación inválida');
    if (fechaReincorporacion.getTime() < _parseDate(retiro.fechaInicio).getTime()) return _resErr('VALIDACION', 'La reincorporación no puede ser anterior al inicio del retiro');

    var lock = LockService.getScriptLock();
    if (!lock.tryLock(8000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
    try {
      var aplicar = {
        estado: 'Finalizado',
        fechaReincorporacion: fechaReincorporacion
      };
      if (_texto(datos.observaciones)) {
        aplicar.observaciones = (String(retiro.observaciones || '') ? String(retiro.observaciones) + ' | ' : '') + 'Reincorporación: ' + _texto(datos.observaciones);
      }
      var res = _actualizarFilaV2(ss, HOJA_V2.retirosTemporales, COL_RETIRO_TEMPORAL, N_COLS_RETIRO_TEMPORAL, retiroId, aplicar);
      if (!res.ok) return res;
      var quien = _quienRegistro();
      var estadoAnterior = _texto(retiro.estadoAnterior);
      var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
        return String(v.id) === String(retiro.voluntarioId);
      });
      if (vol && estadoAnterior && String(vol.estado || '') === 'Inactivo') {
        _actualizarFilaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, vol.id, { estado: estadoAnterior });
        _agregarEventoHojaV2(ss, vol.id, 'SITUACION_ADMINISTRATIVA', _fmtFecha(fechaReincorporacion), 'Estado → ' + estadoAnterior + ' (reincorporación retiro N° ' + retiroId + ')', String(retiroId), quien);
      }
      _agregarEventoHojaV2(ss, retiro.voluntarioId, 'REINCORPORACION', _fmtFecha(fechaReincorporacion), 'Reincorporación desde retiro temporal', String(retiroId), quien);
      _log(ss, HOJA_V2.retirosTemporales, 'reincorporarVoluntarioV2', 'OK', retiroId + ' — voluntario ' + retiro.voluntarioId);
      return _resOk({ id: Number(retiroId), estado: 'Finalizado', fechaReincorporacion: _fechaV2(fechaReincorporacion) });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

/**
 * Anula un retiro Activo (registro histórico; sin borrado físico). datos: {observaciones?}
 * Restaura el estado del voluntario si este sigue en el estado inducido por el retiro.
 * La anulación se registra como evento SITUACION_ADMINISTRATIVA.
 */
function anularRetiroTemporalV2(retiroId, datos) {
  datos = datos || {};
  var ss = _ss();
  try {
    var retiro = _buscarV2(ss, HOJA_V2.retirosTemporales, COL_RETIRO_TEMPORAL, N_COLS_RETIRO_TEMPORAL, function (r) {
      return String(r.id) === String(retiroId);
    });
    if (!retiro) return _resErr('NO_ENCONTRADO', 'Retiro temporal ' + retiroId + ' no existe');
    if (String(retiro.estado || '') !== 'Activo') return _resErr('VALIDACION', 'Solo un retiro Activo puede anularse');

    var lock = LockService.getScriptLock();
    if (!lock.tryLock(8000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
    try {
      var aplicar = { estado: 'Anulado' };
      if (_texto(datos.observaciones)) {
        aplicar.observaciones = (String(retiro.observaciones || '') ? String(retiro.observaciones) + ' | ' : '') + 'Anulado: ' + _texto(datos.observaciones);
      }
      var res = _actualizarFilaV2(ss, HOJA_V2.retirosTemporales, COL_RETIRO_TEMPORAL, N_COLS_RETIRO_TEMPORAL, retiroId, aplicar);
      if (!res.ok) return res;
      var quien = _quienRegistro();
      var estadoAnterior = _texto(retiro.estadoAnterior);
      var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
        return String(v.id) === String(retiro.voluntarioId);
      });
      if (vol && estadoAnterior && String(vol.estado || '') === 'Inactivo') {
        _actualizarFilaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, vol.id, { estado: estadoAnterior });
        _agregarEventoHojaV2(ss, vol.id, 'SITUACION_ADMINISTRATIVA', _fmtFecha(new Date()), 'Estado → ' + estadoAnterior + ' (anulación retiro N° ' + retiroId + ')', String(retiroId), quien);
      }
      _agregarEventoHojaV2(ss, retiro.voluntarioId, 'SITUACION_ADMINISTRATIVA', _fmtFecha(new Date()), 'Retiro temporal N° ' + retiroId + ' anulado', String(retiroId), quien);
      _log(ss, HOJA_V2.retirosTemporales, 'anularRetiroTemporalV2', 'OK', retiroId + ' — voluntario ' + retiro.voluntarioId);
      return _resOk({ id: Number(retiroId), estado: 'Anulado' });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

/**
 * Lista retiros temporales (opcionalmente de un voluntario), con nombre del voluntario.
 * Orden: fecha de inicio descendente.
 */
function listarRetirosTemporalesV2(voluntarioId) {
  var ss = _ss();
  try {
    var filas = _tablaV2(ss, HOJA_V2.retirosTemporales, COL_RETIRO_TEMPORAL, N_COLS_RETIRO_TEMPORAL);
    var voluntarios = _tablaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2);
    var personas = _tablaV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA);
    var porPersona = {};
    for (var p = 0; p < personas.length; p++) porPersona[String(personas[p].id)] = personas[p];
    var porVol = {};
    for (var v = 0; v < voluntarios.length; v++) porVol[String(voluntarios[v].id)] = voluntarios[v];
    var res = [];
    for (var i = 0; i < filas.length; i++) {
      var r = filas[i];
      if (voluntarioId !== undefined && String(r.voluntarioId) !== String(voluntarioId)) continue;
      var vol = porVol[String(r.voluntarioId)];
      res.push({
        id: r.id,
        voluntarioId: String(r.voluntarioId || ''),
        voluntario: vol ? _nombreVoluntarioV2(personas, porPersona, vol) : '—',
        sedeId: String(r.sedeId || ''),
        fechaInicio: _fechaV2(r.fechaInicio),
        fechaTermino: _fechaV2(r.fechaTermino) || '',
        documento: String(r.documento || ''),
        documentoFecha: _fechaV2(r.documentoFecha) || '',
        documentoDescripcion: String(r.documentoDescripcion || ''),
        motivo: String(r.motivo || ''),
        observaciones: String(r.observaciones || ''),
        estado: String(r.estado || ''),
        fechaReincorporacion: _fechaV2(r.fechaReincorporacion) || '',
        estadoAnterior: String(r.estadoAnterior || ''),
        registradoPor: String(r.registradoPor || '')
      });
    }
    res.sort(function (a, b) { return _parseDate(b.fechaInicio || '01/01/2000') - _parseDate(a.fechaInicio || '01/01/2000'); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

/**
 * Antigüedades derivadas de un voluntario (preparada para la Ficha V2).
 * Los períodos de retiro descontables (Activo/Finalizado) se descuentan según la
 * regla configurable RETIRO_AFECTA_ANTIGUEDAD_* de la hoja Config.
 */
function obtenerAntiguedadV2(voluntarioId) {
  var ss = _ss();
  try {
    var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
      return String(v.id) === String(voluntarioId);
    });
    if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario ' + voluntarioId + ' no existe');

    var periodos = _periodosDescontablesV2(ss, voluntarioId);
    var conf = {
      institucional: _configSi(ss, 'RETIRO_AFECTA_ANTIGUEDAD_INSTITUCIONAL', true),
      grado: _configSi(ss, 'RETIRO_AFECTA_ANTIGUEDAD_GRADO', false),
      cargo: _configSi(ss, 'RETIRO_AFECTA_ANTIGUEDAD_CARGO', false)
    };
    var hastaBase = _parseDate(vol.fechaEgreso) || new Date();

    var institucional = _calcularAntiguedadV2({ desde: vol.fechaIngreso, hasta: hastaBase, periodos: periodos, descontar: conf.institucional });

    var hg = null;
    var histG = _tablaV2(ss, HOJA_V2.historialGrados, COL_HIST_GRADO, N_COLS_HIST_GRADO);
    for (var g = 0; g < histG.length; g++) {
      if (String(histG[g].voluntarioId) === String(voluntarioId) && !_texto(histG[g].fechaHasta)) hg = histG[g];
    }
    var enGrado = hg
      ? _calcularAntiguedadV2({ desde: hg.fechaDesde, hasta: _parseDate(hg.fechaHasta) || hastaBase, periodos: periodos, descontar: conf.grado })
      : { dias: 0, ms: 0, texto: '—', descontado: false };

    var hc = null;
    var histC = _tablaV2(ss, HOJA_V2.historialCargos, COL_HIST_CARGO, N_COLS_HIST_CARGO);
    for (var c = 0; c < histC.length; c++) {
      if (String(histC[c].voluntarioId) === String(voluntarioId) && !_texto(histC[c].fechaHasta)) hc = histC[c];
    }
    var enCargo = hc
      ? _calcularAntiguedadV2({ desde: hc.fechaDesde, hasta: _parseDate(hc.fechaHasta) || hastaBase, periodos: periodos, descontar: conf.cargo })
      : { dias: 0, ms: 0, texto: '—', descontado: false };

    return _resOk({
      voluntarioId: String(voluntarioId),
      estado: String(vol.estado || ''),
      enRetiro: !!_retiroActivoV2(ss, voluntarioId),
      fechaIngresoInstitucional: _fechaV2(vol.fechaIngreso) || '',
      antiguedadInstitucional: institucional.texto,
      antiguedadInstitucionalDias: institucional.dias,
      retiroDescontadoInstitucional: institucional.descontado,
      fechaInicioGrado: hg ? _fechaV2(hg.fechaDesde) : '',
      antiguedadGrado: enGrado.texto,
      antiguedadGradoDias: enGrado.dias,
      retiroDescontadoGrado: enGrado.descontado,
      fechaInicioCargo: hc ? _fechaV2(hc.fechaDesde) : '',
      antiguedadCargo: enCargo.texto,
      antiguedadCargoDias: enCargo.dias,
      retiroDescontadoCargo: enCargo.descontado,
      periodosRetiroDescontados: periodos.map(function (p) {
        return {
          retiroId: p.retiroId,
          fechaInicio: _fechaV2(p.inicio) || '',
          fechaTermino: _fechaV2(p.termino) || '',
          estado: p.estado,
          dias: Math.max(0, Math.round((( _parseDate(p.termino) || new Date()).getTime() - _parseDate(p.inicio).getTime()) / 86400000))
        };
      })
    });
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}