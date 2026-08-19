/**
 * 32_ConfigV2.js — Configuración V2 (fase 10).
 * Sedes (OFICIAL: licencia radio, indicativo, datos técnicos) y parámetros.
 * Los parámetros viven en la hoja Config (CONFIG_DEF en constantes); la Web App
 * los lee y solo un perfil Administrador puede actualizar el valor.
 * API:
 *   listarSedesV2 / crearSedeV2 / actualizarSedeV2
 *   listarParametrosV2() / actualizarParametroV2(parametro, valor)
 */

function listarSedesV2() {
  try {
    var ss = _ss();
    var filas = _tablaV2(ss, HOJA_V2.sedes, COL_SEDE, N_COLS_SEDE);
    var res = filas.map(function (f) {
      return {
        id: f.id,
        nombre: String(f.nombre || ''),
        direccion: String(f.direccion || ''),
        comuna: String(f.comuna || ''),
        region: String(f.region || ''),
        lugar: String(f.lugar || ''),
        coordenadas: String(f.coordenadas || ''),
        licenciaRadio: String(f.licenciaRadio || ''),
        indicativo: String(f.indicativo || ''),
        datosTecnicosRadio: String(f.datosTecnicosRadio || ''),
        responsableId: String(f.responsableId || ''),
        observaciones: String(f.observaciones || '')
      };
    }).sort(function (a, b) { return _norm(a.nombre).localeCompare(_norm(b.nombre)); });
    return _resOk(res);
  } catch (err) {
    return _resErr('INTERNO', String(err));
  }
}

function crearSedeV2(datos) {
  datos = datos || {};
  var ss = _ss();
  var nombre = _titulo(datos.nombre);
  if (!nombre) return _resErr('DATOS_INCOMPLETOS', 'Nombre de la sede: obligatorio');
  var fila = {};
  fila[COL_SEDE.nombre] = nombre;
  fila[COL_SEDE.direccion] = _texto(datos.direccion);
  fila[COL_SEDE.comuna] = _texto(datos.comuna);
  fila[COL_SEDE.region] = _texto(datos.region);
  fila[COL_SEDE.lugar] = _texto(datos.lugar);
  fila[COL_SEDE.coordenadas] = _texto(datos.coordenadas);
  fila[COL_SEDE.licenciaRadio] = _texto(datos.licenciaRadio);
  fila[COL_SEDE.indicativo] = _texto(datos.indicativo);
  fila[COL_SEDE.datosTecnicosRadio] = _texto(datos.datosTecnicosRadio);
  fila[COL_SEDE.responsableId] = _texto(datos.responsableId);
  fila[COL_SEDE.observaciones] = _texto(datos.observaciones);
  var res = _insertarFilaV2(ss, HOJA_V2.sedes, COL_SEDE, N_COLS_SEDE, fila);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.sedes, 'crearSedeV2', 'OK', res.data.id + ' — ' + nombre);
  return _resOk({ id: res.data.id });
}

function actualizarSedeV2(id, cambios) {
  cambios = cambios || {};
  var ss = _ss();
  var aplicar = {};
  if (cambios.nombre !== undefined) {
    var nombre = _titulo(cambios.nombre);
    if (!nombre) return _resErr('DATOS_INCOMPLETOS', 'Nombre: obligatorio');
    aplicar[COL_SEDE.nombre] = nombre;
  }
  if (cambios.direccion !== undefined) aplicar[COL_SEDE.direccion] = _texto(cambios.direccion);
  if (cambios.comuna !== undefined) aplicar[COL_SEDE.comuna] = _texto(cambios.comuna);
  if (cambios.region !== undefined) aplicar[COL_SEDE.region] = _texto(cambios.region);
  if (cambios.lugar !== undefined) aplicar[COL_SEDE.lugar] = _texto(cambios.lugar);
  if (cambios.coordenadas !== undefined) aplicar[COL_SEDE.coordenadas] = _texto(cambios.coordenadas);
  if (cambios.licenciaRadio !== undefined) aplicar[COL_SEDE.licenciaRadio] = _texto(cambios.licenciaRadio);
  if (cambios.indicativo !== undefined) aplicar[COL_SEDE.indicativo] = _texto(cambios.indicativo);
  if (cambios.datosTecnicosRadio !== undefined) aplicar[COL_SEDE.datosTecnicosRadio] = _texto(cambios.datosTecnicosRadio);
  if (cambios.responsableId !== undefined) aplicar[COL_SEDE.responsableId] = _texto(cambios.responsableId);
  if (cambios.observaciones !== undefined) aplicar[COL_SEDE.observaciones] = _texto(cambios.observaciones);
  var res = _actualizarFilaV2(ss, HOJA_V2.sedes, COL_SEDE, N_COLS_SEDE, id, aplicar);
  if (!res.ok) return res;
  _log(ss, HOJA_V2.sedes, 'actualizarSedeV2', 'OK', id);
  return _resOk({ id: id });
}

/** Parámetros de Config (solo lectura desde la Web App). */
function listarParametrosV2() {
  return obtenerConfiguracion();
}

/** Actualiza el Valor de un parámetro de Config (uso administrativo). */
function actualizarParametroV2(parametro, valor) {
  parametro = _texto(parametro);
  if (!parametro) return _resErr('DATOS_INCOMPLETOS', 'Parámetro: obligatorio');
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.config);
  if (!sh) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura no creada');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    var ultima = sh.getLastRow();
    if (ultima < 2) return _resErr('NO_ENCONTRADO', 'No hay parámetros en Config');
    var datos = sh.getRange(2, 1, ultima - 1, 3).getValues();
    for (var i = 0; i < datos.length; i++) {
      if (String(datos[i][0] || '') === parametro) {
        var tipo = String(datos[i][2] || '');
        var nuevo = _texto(valor);
        if (tipo === 'numero') {
          var n = Number(nuevo);
          if (isNaN(n)) return _resErr('VALIDACION', 'El parámetro ' + parametro + ' es numérico');
          nuevo = String(n);
        }
        sh.getRange(2 + i, 2).setValue(nuevo);
        _log(ss, HOJA.config, 'actualizarParametroV2', 'OK', parametro + ' = ' + nuevo);
        return _resOk({ parametro: parametro, valor: nuevo });
      }
    }
    return _resErr('NO_ENCONTRADO', 'Parámetro ' + parametro + ' no existe en Config');
  } finally {
    lock.releaseLock();
  }
}