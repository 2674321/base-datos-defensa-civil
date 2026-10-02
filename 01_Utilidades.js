/**
 * 01_Utilidades.js — Helpers genéricos sin lógica de negocio.
 * Acceso a la hoja, RUT, fechas, normalización de texto, logging y config con caché.
 */

// Clave de Script Property donde se guarda el ID de la hoja de producción.
var CLAVE_SS_ID = 'SS_ID';

// Resuelve el ID de la hoja desde Script Properties (no versionado).
// Lanza un error claro si el despliegue no lo ha configurado.
function getSpreadsheetId_() {
  var id = '';
  try {
    id = String(
      PropertiesService.getScriptProperties().getProperty(CLAVE_SS_ID) || ''
    ).trim();
  } catch (e) {
    id = '';
  }
  if (!id) {
    throw new Error(
      "Falta la Script Property '" +
        CLAVE_SS_ID +
        "'. Configúrala en Configuración del proyecto > Propiedades de la secuencia " +
        "de comandos, o con: PropertiesService.getScriptProperties().setProperty('" +
        CLAVE_SS_ID +
        "', '<ID_HOJA>'). Ver docs/CONFIGURACION_CLASP.md."
    );
  }
  return id;
}

function _ss() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    return SpreadsheetApp.openById(getSpreadsheetId_());
  }
}

function _mayus(s) {
  return String(s || '').trim().replace(/\s+/g, ' ').replace(/(^|\s)\S/g, function (c) {
    return c.toUpperCase();
  });
}

function _quitarAcentos(s) {
  var mapa = {
    'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'Á': 'A', 'À': 'A', 'Ä': 'A', 'Â': 'A',
    'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e', 'É': 'E', 'È': 'E', 'Ë': 'E', 'Ê': 'E',
    'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i', 'Í': 'I', 'Ì': 'I', 'Ï': 'I', 'Î': 'I',
    'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'Ó': 'O', 'Ò': 'O', 'Ö': 'O', 'Ô': 'O',
    'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u', 'Ú': 'U', 'Ù': 'U', 'Ü': 'U', 'Û': 'U',
    'ñ': 'n', 'Ñ': 'N'
  };
  return String(s || '').replace(/[áàäâÁÀÄÂéèëêÉÈËÊíìïîÍÌÏÎóòöôÓÒÖÔúùüûÚÙÜÛñÑ]/g, function (c) {
    return mapa[c] || c;
  });
}

function _norm(s) {
  // V3.4G: si s es un array (p. ej. niveles/modelos del API), únelo en lista.
  if (Array.isArray(s)) s = s.join('; ');
  return _quitarAcentos(String(s || '')).toLowerCase().trim().replace(/\s+/g, ' ');
}

function _texto(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

/**
 * Título gramatical: capitaliza palabras excepto artículos/preposiciones menores
 * ('polera pique' → 'Polera Pique'; 'gorra con cubrenuca' → 'Gorra con Cubrenuca').
 */
function _titulo(s) {
  var MENORES = ['de', 'la', 'del', 'las', 'los', 'y', 'con', 'sin', 'el', 'al', 'a', 'e', 'o', 'u', 'en', 'por', 'para'];
  var palabras = String(s || '').trim().toLowerCase().split(/\s+/);
  for (var i = 0; i < palabras.length; i++) {
    var p = palabras[i];
    if (!p) continue;
    if (i > 0 && MENORES.indexOf(p) !== -1) continue;
    palabras[i] = p.charAt(0).toUpperCase() + p.slice(1);
  }
  return palabras.join(' ');
}

/** Convierte a booleano con default: TRUE/'TRUE'/1/'1' → true; FALSE/'FALSE'/0/'0' → false; resto → dflt. */
function _bool(v, dflt) {
  if (v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1') return true;
  if (v === false || v === 'FALSE' || v === 'false' || v === 0 || v === '0') return false;
  return !!dflt;
}

// --- Formato de respuesta canónico de la API backend {ok, data, error} ---

function _resOk(data) {
  return { ok: true, data: data, error: null };
}

function _resErr(code, message) {
  return { ok: false, data: null, error: { code: code, message: message } };
}

// --- RUT chileno ---

function _calcularDV(run) {
  var r = String(run || '').replace(/\D/g, '');
  if (!r) return '';
  var suma = 0;
  var mult = 2;
  for (var i = r.length - 1; i >= 0; i--) {
    suma += parseInt(r.charAt(i), 10) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  var resto = suma % 11;
  var dv = 11 - resto;
  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return String(dv);
}

/**
 * Valida un RUN chileno. Acepta "12345678-9", "12345678K" o solo dígitos (calcula el DV).
 * @return {Object} {ok, run, error}
 */
function _validarRUT(valor) {
  var s = String(valor || '').trim().toUpperCase().replace(/\./g, '').replace(/\s/g, '');
  if (!s) return { ok: false, error: 'RUN vacío' };
  var m = s.match(/^(\d{1,8})-([0-9K])$/);
  if (m) {
    var dv = _calcularDV(m[1]);
    if (dv !== m[2]) return { ok: false, error: 'Dígito verificador incorrecto (debe ser ' + dv + ')' };
    return { ok: true, run: m[1] + '-' + dv, error: '' };
  }
  m = s.match(/^(\d{1,8})$/);
  if (m) {
    return { ok: true, run: m[1] + '-' + _calcularDV(m[1]), error: '', calculado: true };
  }
  m = s.match(/^(\d{1,8})([0-9K])$/);
  if (m) {
    var dv2 = _calcularDV(m[1]);
    if (dv2 !== m[2]) return { ok: false, error: 'Dígito verificador incorrecto (debe ser ' + dv2 + ')' };
    return { ok: true, run: m[1] + '-' + dv2, error: '' };
  }
  return { ok: false, error: 'Formato RUN inválido (ej. 12345678-9)' };
}

function _formatearRUT(valor) {
  var r = _validarRUT(valor);
  return r.ok ? r.run : String(valor || '').trim();
}

// --- Fechas ---

/**
 * Parsea una fecha desde Date, serial de hoja o texto dd/mm/aaaa.
 * @return {Date|null}
 */
function _parseDate(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === 'number') {
    var d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : d;
  }
  var s = String(v || '').trim();
  if (!s) return null;
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    var d2 = new Date(+m[3], +m[2] - 1, +m[1]);
    if (d2.getDate() !== +m[1] || d2.getMonth() !== +m[2] - 1) return null;
    return d2;
  }
  var d3 = new Date(s);
  return isNaN(d3.getTime()) ? null : d3;
}

function _fmtFecha(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) return '';
  var dd = ('0' + d.getDate()).slice(-2);
  var mm = ('0' + (d.getMonth() + 1)).slice(-2);
  return dd + '/' + mm + '/' + d.getFullYear();
}

// --- Validaciones simples ---

function _esCorreoValido(s) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || '').trim());
}

function _esTelefonoValido(s) {
  var limpio = String(s || '').replace(/[^\d]/g, '');
  return limpio.length >= 7 && limpio.length <= 13;
}

// --- Log en hoja (LockService + autoacote, nunca lanza) ---

function _log(ss, pagina, evento, resultado, detalle) {
  try {
    var lock = LockService.getScriptLock();
    var tenido = lock.tryLock(3000);
    try {
      var sh = ss.getSheetByName(HOJA.log);
      if (!sh) sh = ss.insertSheet(HOJA.log, ss.getSheets().length);
      if (sh.getLastRow() === 0) {
        sh.getRange(1, 1, 1, 5).setValues([['Timestamp', 'Página', 'Evento', 'Resultado', 'Detalle']]);
        sh.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground(COLOR.encabezado).setFontColor(COLOR.encabezadoTexto);
      }
      sh.appendRow([new Date(), pagina, evento, resultado, detalle || '']);
      var ultima = sh.getLastRow();
      if (ultima > LOG_MAX_FILAS + 1) sh.deleteRows(LOG_MAX_FILAS + 2, ultima - LOG_MAX_FILAS - 1);
    } finally {
      if (tenido) lock.releaseLock();
    }
  } catch (err) {
    console.error('_log: ' + err);
  }
}

// --- Config en hoja con caché doble (variable + CacheService, TTL 30 s) ---

var _CONFIG_CACHE = null;
var _CONFIG_CACHE_TS = 0;
var _CONFIG_TTL = 30000;

function _leerConfig(ss, parametro) {
  var ahora = Date.now();
  if (!_CONFIG_CACHE || ahora - _CONFIG_CACHE_TS > _CONFIG_TTL) {
    var cache = CacheService.getScriptCache();
    var c = cache.get('DC_CONFIG');
    if (c) {
      try {
        _CONFIG_CACHE = JSON.parse(c);
      } catch (e) {
        _CONFIG_CACHE = null;
      }
    }
    if (!_CONFIG_CACHE) {
      _CONFIG_CACHE = {};
      var sh = ss.getSheetByName(HOJA.config);
      if (sh) {
        var ult = sh.getLastRow();
        if (ult > 0) {
          var datos = sh.getRange(1, 1, ult, 2).getValues();
          for (var i = 1; i < datos.length; i++) {
            if (datos[i][0]) _CONFIG_CACHE[String(datos[i][0]).toUpperCase()] = String(datos[i][1] || '');
          }
        }
      }
      cache.put('DC_CONFIG', JSON.stringify(_CONFIG_CACHE), Math.ceil(_CONFIG_TTL / 1000));
    }
    _CONFIG_CACHE_TS = ahora;
  }
  var clave = String(parametro).toUpperCase();
  return _CONFIG_CACHE[clave] !== undefined ? _CONFIG_CACHE[clave] : '';
}

function _configLista(ss, parametro) {
  var v = _leerConfig(ss, parametro);
  return v ? v.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s; }) : [];
}

/** Lee un parámetro numérico de Config con default seguro (nunca lanza). Vacío/ausente → default. */
function _configNumero(ss, parametro, dflt) {
  var s = String(_leerConfig(ss, parametro) || '').trim();
  if (!s) return dflt === undefined ? 0 : dflt;
  var v = Number(s.replace(',', '.'));
  return isNaN(v) || v < 0 ? (dflt === undefined ? 0 : dflt) : v;
}

function _invalidarConfigCache() {
  _CONFIG_CACHE = null;
  _CONFIG_CACHE_TS = 0;
  try {
    CacheService.getScriptCache().remove('DC_CONFIG');
  } catch (e) {}
}

// --- IDs con prefijo (E-001, INV-002, ENT-003) ---

/**
 * Calcula el siguiente ID con prefijo a partir de un batch de IDs existentes.
 * Puro (sin servicios): testeable en CLI.
 */
function _siguienteIdPrefijo(existentes, prefijo) {
  var max = 0;
  for (var i = 0; i < existentes.length; i++) {
    var s = String(existentes[i] || '');
    if (s.indexOf(prefijo) === 0) {
      var n = parseInt(s.slice(prefijo.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  }
  return prefijo + ('000' + (max + 1)).slice(-3);
}

/** Busca la fila (índice absoluto) cuyo ID esté en la columna 1 de la hoja. @return {Number|null} */
function _filaPorIdEn(sh, id) {
  var ultima = sh.getLastRow();
  if (ultima < PRIMERA_FILA_DATO) return null;
  var ids = sh.getRange(PRIMERA_FILA_DATO, 1, ultima - PRIMERA_FILA_DATO + 1, 1).getValues();
  var q = String(id).trim();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === q) return PRIMERA_FILA_DATO + i;
  }
  return null;
}