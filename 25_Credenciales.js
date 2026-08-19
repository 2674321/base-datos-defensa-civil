/**
 * 25_Credenciales.js — Dominio Credenciales (fase 4).
 * V3.4H: el catálogo de Credenciales es una PLANTA de tipos de licencia —
 * solo {nombre, emisor, estado Activo/Inactivo}. N°, emisión, vencimiento,
 * distintivo, nivel, modelos y observaciones viven ÚNICAMENTE en la asignación
 * (Voluntario_Credencial), que mantiene ESTADOS_CREDENCIAL (Vigente/Por
 * vencer/Vencida/Revocada).
 * API:
 *   listarCredencialesV2 / crearCredencialV2 / actualizarCredencialV2
 *   asignarCredencialV2(voluntarioId, credencialId, datos) / quitarCredencialV2(id, datos?) → revoca (V3.3)
 *   listarCredencialesVoluntarioV2(voluntarioId, opciones?) — opciones.incluirCerradas
 *   obtenerVencimientosV2({dias}) → credenciales vencidas/por vencer (excluye revocadas, V3.3)
 */

/** Estado de PLANTA del tipo de credencial: 'Activo'/'Inactivo'. El valor
 *  legacy 'Vigente' de la hoja se interpreta como 'Activo'. */
function _estadoTipoCredencialV2(credencial) {
  return String(credencial && credencial.estado || '') === 'Inactivo' ? 'Inactivo' : 'Activo';
}

function _estadoCredencialDerivado(credencial, diasUmbral) {
  var venc = _parseDate(credencial.fechaVencimiento);
  if (!venc) return 'Vigente';
  var manual = String(credencial.estado || '');
  // V3.4H: el estado de la planta (Activo/Inactivo) NO es estado de vigencia.
  if (manual && manual !== 'Vigente' && manual !== 'Por vencer' && manual !== 'Activo' && manual !== 'Inactivo') return manual;
  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  var v = new Date(venc); v.setHours(0, 0, 0, 0);
  var dias = Math.round((v.getTime() - hoy.getTime()) / 86400000);
  if (dias < 0) return 'Vencida';
  if (dias <= diasUmbral) return 'Por vencer';
  return 'Vigente';
}

function listarCredencialesV2() {
  try {
    var ss = _ss();
    var cred = _tablaV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL);
    var res = cred.map(function (c) {
      return {
        id: c.id,
        nombre: String(c.nombre || ''),
        emisor: String(c.emisor || ''),
        estado: _estadoTipoCredencialV2(c)
      };
    }).sort(function (a, b) { return _norm(a.nombre).localeCompare(_norm(b.nombre)); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function crearCredencialV2(datos) {
  datos = datos || {};
  var ss = _ss();
  var nombre = _titulo(datos.nombre);
  if (!nombre) return _resErr('DATOS_INCOMPLETOS', 'Nombre de la credencial: obligatorio');
  var estado = _texto(datos.estado) || 'Activo';
  if (ESTADOS_TIPO_CREDENCIAL.indexOf(estado) === -1) {
    return _resErr('VALIDACION', 'Estado debe ser: ' + ESTADOS_TIPO_CREDENCIAL.join(', '));
  }
  var fila = {};
  fila[COL_CREDENCIAL.nombre] = nombre;
  fila[COL_CREDENCIAL.emisor] = _texto(datos.emisor);
  fila[COL_CREDENCIAL.estado] = estado;
  var res = _insertarFilaV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL, fila);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.credenciales, 'crearCredencialV2', 'OK', res.data.id + ' — ' + nombre);
  return _resOk({ id: res.data.id });
}

function actualizarCredencialV2(id, cambios) {
  cambios = cambios || {};
  var ss = _ss();
  var aplicar = {};
  var errores = [];
  if (cambios.nombre !== undefined) {
    var nombre = _titulo(cambios.nombre);
    if (!nombre) errores.push('Nombre: obligatorio');
    else aplicar[COL_CREDENCIAL.nombre] = nombre;
  }
  if (cambios.estado !== undefined) {
    var estado = _texto(cambios.estado);
    if (estado && ESTADOS_TIPO_CREDENCIAL.indexOf(estado) === -1) errores.push('Estado debe ser: ' + ESTADOS_TIPO_CREDENCIAL.join(', '));
    else aplicar[COL_CREDENCIAL.estado] = estado;
  }
  if (errores.length) return _resErr('VALIDACION', errores.join('\n'));
  if (cambios.emisor !== undefined) aplicar[COL_CREDENCIAL.emisor] = _texto(cambios.emisor);
  var res = _actualizarFilaV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL, id, aplicar);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.credenciales, 'actualizarCredencialV2', 'OK', id);
  return _resOk({ id: id });
}

/**
 * Extrae el indicativo de radioaficionado de un texto de observaciones
 * (V3.4G). Formato chileno: prefijo CD/CA/CE + dígitos + sufijo opcional
 * (p. ej. CA2OPX). @return {Object|null} {indicativo, prefijo}
 */
function _indicativoRadioV2(texto) {
  var m = /(C[ADE])\d{1,4}[A-Z]{0,4}/i.exec(String(texto || ''));
  if (!m) return null;
  return { indicativo: m[0].toUpperCase(), prefijo: m[1].toUpperCase() };
}

function asignarCredencialV2(voluntarioId, credencialId, datos) {
  datos = datos || {};
  var ss = _ss();
  var vol = _buscarV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2, function (v) {
    return String(v.id) === String(voluntarioId);
  });
  if (!vol) return _resErr('NO_ENCONTRADO', 'Voluntario ' + voluntarioId + ' no existe');
  var cred = _buscarV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL, function (c) {
    return String(c.id) === String(credencialId);
  });
  if (!cred) return _resErr('NO_ENCONTRADO', 'Credencial ' + credencialId + ' no existe');
  var fecha = _texto(datos.fechaObtencion) ? _parseDate(datos.fechaObtencion) : new Date();
  if (!fecha) return _resErr('VALIDACION', 'Fecha de obtención inválida');
  var estado = _texto(datos.estado);
  if (estado && ESTADOS_CREDENCIAL.indexOf(estado) === -1) return _resErr('VALIDACION', 'Estado debe ser: ' + ESTADOS_CREDENCIAL.join(', '));
  // V3.4G: nivel (p. ej. Novicio) y modelos habilitados (p. ej. RPAS) como
  // datos de la relación voluntario↔credencial. Para licencias de
  // radioaficionado, el nivel valida el prefijo del indicativo (CA2OPX etc.).
  var nivel = _texto(datos.nivel);
  if (/radioaficionado/i.test(String(cred.nombre || ''))) {
    if (nivel && !PREFIJOS_INDICATIVO_RADIO.hasOwnProperty(nivel)) {
      return _resErr('VALIDACION', 'Nivel de radioaficionado debe ser: ' + Object.keys(PREFIJOS_INDICATIVO_RADIO).join(', '));
    }
    var ind = _indicativoRadioV2(_texto(datos.observaciones));
    if (nivel && ind && ind.prefijo !== PREFIJOS_INDICATIVO_RADIO[nivel]) {
      return _resErr('INDICATIVO_RADIO_INVALIDO', 'El indicativo ' + ind.indicativo + ' no corresponde al nivel ' + nivel + ' (prefijo esperado: ' + PREFIJOS_INDICATIVO_RADIO[nivel] + ')');
    }
  }
  var fila = {};
  fila[COL_VOL_CREDENCIAL.voluntarioId] = voluntarioId;
  fila[COL_VOL_CREDENCIAL.credencialId] = credencialId;
  fila[COL_VOL_CREDENCIAL.fechaObtencion] = fecha;
  fila[COL_VOL_CREDENCIAL.estado] = estado || 'Vigente';
  fila[COL_VOL_CREDENCIAL.observaciones] = _texto(datos.observaciones);
  fila[COL_VOL_CREDENCIAL.nivel] = nivel;
  fila[COL_VOL_CREDENCIAL.modelosHabilitados] = _textoNivelesV2(datos.modelosHabilitados);
  var res = _insertarFilaV2(ss, HOJA_V2.voluntarioCredenciales, COL_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL, fila);
  if (!res.ok) return res;
  _agregarEventoHojaV2(ss, voluntarioId, 'CREDENCIAL', _fmtFecha(fecha), 'Obtención de credencial: ' + cred.nombre, String(res.data.id));
  _log(ss, HOJA_V2.voluntarioCredenciales, 'asignarCredencialV2', 'OK', 'Vol. ' + voluntarioId + ' → ' + cred.nombre);
  return _resOk({ id: res.data.id });
}

/**
 * Revoca lógicamente una credencial asignada (V3.3): NO elimina la fila;
 * conserva la relación y la marca con estado='Revocada' (historial).
 * La credencial revocada no aparece en vencimientos ni en la lista vigente
 * (solo con incluirCerradas). datos: {motivo?} — opcional y compatible.
 */
function quitarCredencialV2(id, datos) {
  var ss = _ss();
  var res = _cerrarFilaV2(ss, HOJA_V2.voluntarioCredenciales, COL_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL, id, datos || {}, 'estado', 'Revocada', 'Revocación (V3.3)');
  if (!res.ok) return res;
  var registro = res.data.registro;
  if (!res.data.yaCerrado && registro && registro.voluntarioId) {
    _agregarEventoHojaV2(ss, String(registro.voluntarioId), 'CREDENCIAL', _fmtFecha(new Date()), 'Revocación de credencial (ref. ' + (registro.credencialId || '') + ')', String(id));
  }
  _log(ss, HOJA_V2.voluntarioCredenciales, 'quitarCredencialV2', 'OK', id + (res.data.yaCerrado ? ' (ya revocada)' : ''));
  return res;
}

/**
 * Lista credenciales de un voluntario (V3.3): vigentes por defecto; con
 * opciones.incluirCerradas=true incluye las revocadas. El estado de la
 * relación ('Revocada') prevalece sobre el derivado del catálogo.
 */
function listarCredencialesVoluntarioV2(voluntarioId, opciones) {
  try {
    var ss = _ss();
    var incluirCerradas = !!(opciones && opciones.incluirCerradas);
    var filas = _tablaV2(ss, HOJA_V2.voluntarioCredenciales, COL_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL).filter(function (v) {
      if (String(v.voluntarioId) !== String(voluntarioId)) return false;
      return incluirCerradas || String(v.estado || '') !== 'Revocada';
    });
    var cred = _tablaV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL);
    var porId = {};
    for (var c = 0; c < cred.length; c++) porId[String(cred[c].id)] = cred[c];
    var umbral = _configNumero(ss, 'ALERTA_CREDENCIALES_DIAS', 30);
    var res = filas.map(function (f) {
      var c = porId[String(f.credencialId)];
      var estadoRel = String(f.estado || '');
      return {
        id: f.id,
        credencialId: String(f.credencialId || ''),
        nombre: c ? c.nombre : String(f.credencialId),
        emisor: c ? String(c.emisor || '') : '',
        numero: c ? String(c.numero || '') : '',
        fechaObtencion: _fechaV2(f.fechaObtencion),
        fechaVencimiento: c ? _fechaV2(c.fechaVencimiento) : '',
        estado: estadoRel === 'Revocada' ? 'Revocada' : _estadoCredencialDerivado(c || {}, umbral),
        observaciones: String(f.observaciones || ''),
        nivel: String(f.nivel || ''),
        modelosHabilitados: _listaNivelesV2(f.modelosHabilitados).join('; ')
      };
    }).sort(function (a, b) { return _norm(a.nombre).localeCompare(_norm(b.nombre)); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

/** Vencimientos globales: credenciales vencidas o por vencer (para alertas y reportes). */
function obtenerVencimientosV2(opciones) {
  opciones = opciones || {};
  try {
    var ss = _ss();
    var dias = _configNumero(ss, 'ALERTA_CREDENCIALES_DIAS', 30);
    if (opciones.dias !== undefined) {
      var n = Number(opciones.dias);
      if (!isNaN(n) && n >= 0) dias = n;
    }
    var cred = _tablaV2(ss, HOJA_V2.credenciales, COL_CREDENCIAL, N_COLS_CREDENCIAL);
    var volCred = _tablaV2(ss, HOJA_V2.voluntarioCredenciales, COL_VOL_CREDENCIAL, N_COLS_VOL_CREDENCIAL);
    var voluntarios = _tablaV2(ss, HOJA_V2.voluntarios, COL_VOLUNTARIO_V2, N_COLS_VOLUNTARIO_V2);
    var personas = _tablaV2(ss, HOJA_V2.personas, COL_PERSONA, N_COLS_PERSONA);
    var nombrePorVol = {};
    for (var v = 0; v < voluntarios.length; v++) {
      var p = null;
      for (var x = 0; x < personas.length; x++) {
        if (String(personas[x].id) === String(voluntarios[v].personaId)) { p = personas[x]; break; }
      }
      nombrePorVol[String(voluntarios[v].id)] = p ? [p.nombres, p.apPaterno, p.apMaterno].filter(function (s) { return String(s).trim(); }).join(' ') : '';
    }
    var res = [];
    for (var i = 0; i < volCred.length; i++) {
      var vc = volCred[i];
      var c = null;
      for (var j = 0; j < cred.length; j++) {
        if (String(cred[j].id) === String(vc.credencialId)) { c = cred[j]; break; }
      }
      if (!c) continue;
      if (String(vc.estado || '') === 'Revocada') continue;
      var estado = _estadoCredencialDerivado(c, dias);
      if (estado === 'Vigente') continue;
      res.push({
        voluntarioId: String(vc.voluntarioId || ''),
        voluntario: nombrePorVol[String(vc.voluntarioId)] || '—',
        credencial: c.nombre,
        fechaVencimiento: _fechaV2(c.fechaVencimiento),
        estado: estado
      });
    }
    res.sort(function (a, b) { return _parseDate(a.fechaVencimiento || '01/01/2100') - _parseDate(b.fechaVencimiento || '01/01/2100'); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}