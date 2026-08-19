/**
 * 03_Voluntarios.js — Dominio voluntarios.
 *
 * CAPA BACKEND (API JSON, llamable por la futura Web App vía google.script.run):
 *   buscarVoluntarios(consulta)      → {ok, data:[{id, run, nombreCompleto, estado}]}
 *   obtenerFichaVoluntario(id)       → {ok, data:{voluntario}} (fechas como dd/mm/aaaa)
 *   crearVoluntario(datos)           → {ok, data:{id}}
 *   actualizarVoluntario(id, cambios)→ {ok, data:{id, sinCambios}}
 *   darDeBajaVoluntario(id)          → {ok, data:{id, yaEgresado}}
 * Respuestas canónicas {ok, data, error} (ver _resOk/_resErr en 01_Utilidades.js).
 * Ninguna depende de la edición manual de hojas ni de ui.prompt/ui.alert.
 *
 * CAPA UI (menús): registrarVoluntario, buscarVoluntario, menuDarDeBajaVoluntario,
 * renumerarVoluntarios — wrappers delgados sobre la API.
 *
 * Todas las operaciones leen/escriben por bloques; ninguna celda a celda.
 */

// ============ API BACKEND ============

function crearVoluntario(datos) {
  datos = datos || {};
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.voluntarios);
  if (!sh) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura no creada: ejecuta menú ⚙️ Sistema → Crear estructura base');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return _resErr('OCUPADO', 'Ocupado, reintenta en unos segundos');
  try {
    var ultimaFila = sh.getLastRow();
    var nFilasExistentes = Math.max(0, ultimaFila - PRIMERA_FILA_DATO + 1);
    var existentes = [];
    if (nFilasExistentes > 0) {
      existentes = sh.getRange(PRIMERA_FILA_DATO, 1, nFilasExistentes, 3).getValues();
    }

    var ctx = _contextoListas(ss);
    var errores = [];
    var fila = [];

    var runVal = _validarRUT(datos.run);
    if (!runVal.ok) {
      errores.push('RUN: ' + runVal.error);
    } else {
      fila[COL.run - 1] = runVal.run;
      var dup = _runDuplicado(existentes, runVal.run);
      if (dup) errores.push('RUN ya registrado: N° ' + dup.id + ' (' + (dup.estado || 'sin estado') + ')');
    }

    var campos = _camposEditables();
    for (var i = 0; i < campos.length; i++) {
      var c = campos[i];
      if (c.col === COL.run) continue; // RUN validado arriba (formato + duplicado)
      var valor = datos[c.key] === undefined || datos[c.key] === null ? '' : datos[c.key];
      if (c.requerido && String(valor).trim() === '') {
        errores.push(ENCABEZADOS[c.col - 1] + ': obligatorio');
        continue;
      }
      var r = _validarCampoVoluntario(c.col, valor, ctx);
      if (!r.valido) {
        errores.push(r.mensaje);
        continue;
      }
      if (r.normalizado !== null) {
        fila[c.col - 1] = r.normalizado;
      } else if (c.col === COL.fechaNac || c.col === COL.fechaIngreso) {
        fila[c.col - 1] = String(valor).trim() ? _parseDate(valor) : null;
      } else {
        fila[c.col - 1] = String(valor).trim();
      }
    }
    if (!fila[COL.fechaIngreso - 1]) fila[COL.fechaIngreso - 1] = new Date();
    if (!fila[COL.estado - 1]) fila[COL.estado - 1] = ESTADO_DEFECTO;

    if (errores.length) return _resErr('VALIDACION', errores.join('\n'));

    var nextRow = Math.max(PRIMERA_FILA_DATO, ultimaFila + 1);
    var nextId = 1;
    for (var y = 0; y < existentes.length; y++) {
      var v = Number(existentes[y][0]);
      if (v && v >= nextId) nextId = v + 1;
    }
    fila[COL.id - 1] = nextId;
    var ahora = new Date();
    fila[COL.fechaRegistro - 1] = ahora;
    fila[COL.ultimaActualizacion - 1] = ahora;

    sh.getRange(nextRow, 1, 1, N_COLS).setValues([fila]);
    _log(ss, HOJA.voluntarios, 'crearVoluntario', 'OK', 'N° ' + nextId + ' — RUN ' + runVal.run);
    return _resOk({ id: nextId });
  } finally {
    lock.releaseLock();
  }
}

function actualizarVoluntario(id, cambios) {
  cambios = cambios || {};
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.voluntarios);
  if (!sh) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura no creada: ejecuta Crear estructura base');
  var filaN = _filaPorId(ss, id);
  if (!filaN) return _resErr('NO_ENCONTRADO', 'Voluntario N° ' + id + ' no existe');

  var ctx = _contextoListas(ss);
  var errores = [];
  var filaActual = sh.getRange(filaN, 1, 1, N_COLS).getValues()[0];
  var cambiosAplicados = [];
  var campos = _camposEditables();

  for (var i = 0; i < campos.length; i++) {
    var c = campos[i];
    if (cambios[c.key] === undefined) continue;
    var valor = cambios[c.key] === null ? '' : cambios[c.key];
    if (c.col === COL.run) {
      var rv = _validarRUT(valor);
      if (!rv.ok) {
        errores.push('RUN: ' + rv.error);
        continue;
      }
      var runActual = String(filaActual[COL.run - 1] || '').replace(/-/g, '').replace(/\./g, '');
      if (runActual !== rv.run.split('-')[0]) {
        var ult = sh.getLastRow();
        var nF = Math.max(0, ult - PRIMERA_FILA_DATO + 1);
        var existentes = nF > 0 ? sh.getRange(PRIMERA_FILA_DATO, 1, nF, 3).getValues() : [];
        existentes.splice(filaN - PRIMERA_FILA_DATO, 1); // excluir la fila que se está editando
        var dup = _runDuplicado(existentes, rv.run);
        if (dup) {
          errores.push('RUN ya registrado: N° ' + dup.id + ' (' + (dup.estado || 'sin estado') + ')');
          continue;
        }
      }
      cambiosAplicados.push({ col: COL.run, valor: rv.run });
      continue;
    }
    var r = _validarCampoVoluntario(c.col, valor, ctx);
    if (!r.valido) {
      errores.push(r.mensaje);
      continue;
    }
    var vFinal;
    if (r.normalizado !== null) {
      vFinal = r.normalizado;
    } else if (c.col === COL.fechaNac || c.col === COL.fechaIngreso) {
      vFinal = String(valor).trim() ? _parseDate(valor) : null;
    } else {
      vFinal = String(valor).trim();
    }
    cambiosAplicados.push({ col: c.col, valor: vFinal });
  }

  if (errores.length) return _resErr('VALIDACION', errores.join('\n'));
  if (!cambiosAplicados.length) return _resOk({ id: id, sinCambios: true });

  for (var j = 0; j < cambiosAplicados.length; j++) {
    filaActual[cambiosAplicados[j].col - 1] = cambiosAplicados[j].valor;
  }
  filaActual[COL.ultimaActualizacion - 1] = new Date();
  sh.getRange(filaN, 1, 1, N_COLS).setValues([filaActual]);
  _log(ss, HOJA.voluntarios, 'actualizarVoluntario', 'OK', 'N° ' + id + ' — ' + cambiosAplicados.length + ' campo(s)');
  return _resOk({ id: id });
}

function buscarVoluntarios(consulta) {
  var ss = _ss();
  var q = _texto(consulta);
  if (!q) return _resOk([]);
  var encontrados = _encontrarVoluntario(ss, q).map(function (v) {
    return { id: v.id, run: v.run, nombreCompleto: v.nombre, estado: v.estado };
  });
  return _resOk(encontrados);
}

function obtenerFichaVoluntario(id) {
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.voluntarios);
  if (!sh) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura no creada');
  var filaN = _filaPorId(ss, id);
  if (!filaN) return _resErr('NO_ENCONTRADO', 'Voluntario N° ' + id + ' no existe');
  var datos = sh.getRange(filaN, 1, 1, N_COLS).getValues()[0];
  return _resOk({ voluntario: _filaAObjeto(datos) });
}

/**
 * Lista completa de voluntarios (para listados y selectores de la Web App).
 * buscarVoluntarios('') devuelve [] a propósito; esta función sí trae todo.
 */
function listarVoluntarios() {
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.voluntarios);
  if (!sh) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura no creada');
  var ultima = sh.getLastRow();
  if (ultima < PRIMERA_FILA_DATO) return _resOk([]);
  var datos = sh.getRange(PRIMERA_FILA_DATO, 1, ultima - PRIMERA_FILA_DATO + 1, N_COLS).getValues();
  var res = [];
  for (var i = 0; i < datos.length; i++) {
    if (!String(datos[i][COL.id - 1] || '')) continue;
    var obj = _filaAObjeto(datos[i]);
    res.push({ id: obj.id, run: obj.run, nombreCompleto: obj.nombreCompleto, estado: obj.estado, cargo: obj.cargo });
  }
  return _resOk(res);
}

function darDeBajaVoluntario(id) {
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.voluntarios);
  if (!sh) return _resErr('ESTRUCTURA_NO_CREADA', 'Estructura no creada');
  var filaN = _filaPorId(ss, id);
  if (!filaN) return _resErr('NO_ENCONTRADO', 'Voluntario N° ' + id + ' no existe');
  var filaActual = sh.getRange(filaN, 1, 1, N_COLS).getValues()[0];
  if (String(filaActual[COL.estado - 1] || '') === 'Egresado') return _resOk({ id: id, yaEgresado: true });
  var obs = String(filaActual[COL.observaciones - 1] || '');
  filaActual[COL.estado - 1] = 'Egresado';
  filaActual[COL.observaciones - 1] = (obs ? obs + '\n' : '') + 'Baja: ' + _fmtFecha(new Date());
  filaActual[COL.ultimaActualizacion - 1] = new Date();
  sh.getRange(filaN, 1, 1, N_COLS).setValues([filaActual]);
  _log(ss, HOJA.voluntarios, 'darDeBajaVoluntario', 'OK', 'N° ' + id);
  return _resOk({ id: id });
}

// ============ CAPA UI (menús — wrappers delgados) ============

function registrarVoluntario() {
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.voluntarios);
  if (!sh) {
    ss.toast('Primero crea la estructura: menú ⚙️ Sistema → Crear estructura base', '⚠️', 8);
    return;
  }
  var entrada = sh.getRange(FILA_ENTRADA, 1, 1, N_COLS).getValues()[0];
  var datos = {};
  var campos = _camposEditables();
  for (var i = 0; i < campos.length; i++) {
    datos[campos[i].key] = entrada[campos[i].col - 1];
  }
  var res = crearVoluntario(datos);
  if (!res.ok) {
    SpreadsheetApp.getUi().alert('⚠️ Revisa la fila ' + FILA_ENTRADA + ':\n\n- ' + res.error.message.split('\n').join('\n- '));
    return;
  }
  sh.getRange(FILA_ENTRADA, 2, 1, N_COLS - 1).clearContent();
  sh.getRange(Math.max(PRIMERA_FILA_DATO, sh.getLastRow()), 1).activate();
  ss.toast('Voluntario N° ' + res.data.id + ' registrado ✔', PROYECTO.nombre, 6);
}

function buscarVoluntario() {
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.voluntarios);
  if (!sh) return;
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt('Buscar voluntario', 'RUN, N° o nombre/apellido:', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var q = resp.getResponseText().trim();
  if (!q) return;
  var encontrados = _encontrarVoluntario(ss, q);
  if (!encontrados.length) {
    ss.toast('No se encontró ningún voluntario con "' + q + '"', '🔍', 6);
    _log(ss, HOJA.voluntarios, 'buscarVoluntario', 'SIN RESULTADOS', q);
    return;
  }
  if (encontrados.length === 1) {
    var v = encontrados[0];
    sh.getRange(v.fila, 1).activate();
    ui.alert('Voluntario encontrado', 'N° ' + v.id + ' — ' + v.nombre + '\nRUN: ' + v.run + '\nEstado: ' + v.estado, ui.ButtonSet.OK);
    _log(ss, HOJA.voluntarios, 'buscarVoluntario', 'OK', v.id + ' — ' + q);
  } else {
    var texto = encontrados.slice(0, 20).map(function (x) {
      return 'N° ' + x.id + ' — ' + x.nombre + ' (' + x.run + ') [' + x.estado + ']';
    }).join('\n');
    if (encontrados.length > 20) texto += '\n… y ' + (encontrados.length - 20) + ' más';
    ui.alert('🔍 ' + encontrados.length + ' coincidencias', texto, ui.ButtonSet.OK);
    _log(ss, HOJA.voluntarios, 'buscarVoluntario', 'MULTIPLES', encontrados.length + ' resultados');
  }
}

function menuDarDeBajaVoluntario() {
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.voluntarios);
  if (!sh) return;
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt('Dar de baja', 'N° o RUN del voluntario:', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var q = resp.getResponseText().trim();
  if (!q) return;
  var encontrados = _encontrarVoluntario(ss, q);
  if (encontrados.length !== 1) {
    ui.alert(encontrados.length ? 'Hay ' + encontrados.length + ' coincidencias; usa el N° exacto.' : 'No se encontró ningún voluntario con "' + q + '"', '', ui.ButtonSet.OK);
    return;
  }
  var v = encontrados[0];
  if (v.estado === 'Egresado') {
    ui.alert('El voluntario N° ' + v.id + ' ya está Egresado.', '', ui.ButtonSet.OK);
    return;
  }
  var conf = ui.alert('Confirmar baja', '¿Dar de baja a ' + v.nombre + ' (N° ' + v.id + ', RUN ' + v.run + ')?\nSe marcará como Egresado.', ui.ButtonSet.YES_NO);
  if (conf !== ui.Button.YES) return;
  var res = darDeBajaVoluntario(v.id);
  if (!res.ok) {
    ui.alert('⚠️ ' + res.error.message, '', ui.ButtonSet.OK);
    return;
  }
  ss.toast('Voluntario N° ' + v.id + ' dado de baja ✔', PROYECTO.nombre, 6);
}

function renumerarVoluntarios() {
  var ss = _ss();
  var sh = ss.getSheetByName(HOJA.voluntarios);
  if (!sh) return;
  var ui = SpreadsheetApp.getUi();
  var conf = ui.alert('Renumerar', '¿Renumerar los IDs (columna N°) de todos los voluntarios?', ui.ButtonSet.YES_NO);
  if (conf !== ui.Button.YES) return;
  var ultima = sh.getLastRow();
  if (ultima < PRIMERA_FILA_DATO) return;
  var datos = sh.getRange(PRIMERA_FILA_DATO, 1, ultima - PRIMERA_FILA_DATO + 1, N_COLS).getValues();
  var ids = [];
  var n = 0;
  for (var i = 0; i < datos.length; i++) {
    var tiene = datos[i].some(function (c) { return c !== '' && c !== null; });
    if (tiene) {
      n++;
      ids.push([n]);
    } else {
      ids.push(['']);
    }
  }
  sh.getRange(PRIMERA_FILA_DATO, COL.id, ids.length, 1).setValues(ids);
  _log(ss, HOJA.voluntarios, 'renumerarVoluntarios', 'OK', n + ' IDs reasignados');
  ss.toast('IDs renumerados ✔', PROYECTO.nombre, 5);
}

// ============ HELPERS DEL DOMINIO ============

function _camposEditables() {
  return [
    { col: COL.run, key: 'run' },
    { col: COL.nombres, key: 'nombres', requerido: true },
    { col: COL.apPaterno, key: 'apPaterno', requerido: true },
    { col: COL.apMaterno, key: 'apMaterno' },
    { col: COL.fechaNac, key: 'fechaNacimiento' },
    { col: COL.sexo, key: 'sexo' },
    { col: COL.telefono, key: 'telefono' },
    { col: COL.correo, key: 'correo' },
    { col: COL.direccion, key: 'direccion' },
    { col: COL.comuna, key: 'comuna' },
    { col: COL.emergenciaNombre, key: 'emergenciaNombre' },
    { col: COL.emergenciaTelefono, key: 'emergenciaTelefono' },
    { col: COL.fechaIngreso, key: 'fechaIngreso' },
    { col: COL.estado, key: 'estado' },
    { col: COL.categoria, key: 'categoria' },
    { col: COL.cargo, key: 'cargo' },
    { col: COL.observaciones, key: 'observaciones' }
  ];
}

/** Todos los campos legibles de la ficha (editables + columnas de sistema). */
function _camposVoluntarios() {
  return _camposEditables().concat([
    { col: COL.fechaRegistro, key: 'fechaRegistro', sistema: true },
    { col: COL.ultimaActualizacion, key: 'ultimaActualizacion', sistema: true }
  ]);
}

function _contextoListas(ss) {
  return {
    estados: _configLista(ss, 'ESTADOS'),
    categorias: _configLista(ss, 'CATEGORIAS'),
    sexos: _configLista(ss, 'SEXOS'),
    cargos: _configLista(ss, 'CARGO')
  };
}

/**
 * Valida y normaliza el valor de un campo de la hoja Voluntarios.
 * Fuente ÚNICA de reglas: la usan onEdit (04_Eventos.js), crearVoluntario y
 * actualizarVoluntario. Nunca depende de servicios de Sheets.
 * @return {Object} {valido, normalizado (null si no aplica), mensaje}
 */
function _validarCampoVoluntario(col, valor, ctx) {
  var r = { valido: true, normalizado: null, mensaje: '' };
  if (valor === undefined || valor === null) valor = '';
  var texto = String(valor).trim();
  switch (col) {
    case COL.run:
      if (texto) {
        var v = _validarRUT(valor);
        if (v.ok) r.normalizado = v.run;
        else { r.valido = false; r.mensaje = 'RUN: ' + v.error; }
      }
      break;
    case COL.nombres:
    case COL.apPaterno:
    case COL.apMaterno:
    case COL.emergenciaNombre:
      if (texto) r.normalizado = _mayus(valor);
      break;
    case COL.fechaNac:
    case COL.fechaIngreso:
      if (texto && !_parseDate(valor)) {
        r.valido = false;
        r.mensaje = ENCABEZADOS[col - 1] + ': fecha inválida (dd/mm/aaaa)';
      }
      break;
    case COL.correo:
      if (texto && !_esCorreoValido(valor)) {
        r.valido = false;
        r.mensaje = 'Correo inválido';
      }
      break;
    case COL.telefono:
    case COL.emergenciaTelefono:
      if (texto && !_esTelefonoValido(valor)) {
        r.valido = false;
        r.mensaje = 'Teléfono inválido (7 a 13 dígitos)';
      }
      break;
    case COL.estado:
      if (texto && ctx.estados.length && ctx.estados.indexOf(texto) === -1) {
        r.valido = false;
        r.mensaje = 'Estado debe ser: ' + ctx.estados.join(', ');
      }
      break;
    case COL.categoria:
      if (texto && ctx.categorias.length && ctx.categorias.indexOf(texto) === -1) {
        r.valido = false;
        r.mensaje = 'Categoría debe ser: ' + ctx.categorias.join(', ');
      }
      break;
    case COL.sexo:
      if (texto && ctx.sexos.length && ctx.sexos.indexOf(texto) === -1) {
        r.valido = false;
        r.mensaje = 'Sexo debe ser: ' + ctx.sexos.join(', ');
      }
      break;
    case COL.cargo:
      if (texto && ctx.cargos.length && ctx.cargos.indexOf(texto) === -1) {
        r.valido = false;
        r.mensaje = 'Cargo debe ser: ' + ctx.cargos.join(', ');
      }
      break;
  }
  return r;
}

/**
 * Convierte una fila (array N_COLS) en objeto con claves semánticas.
 * Las fechas se devuelven como texto dd/mm/aaaa (serializable por google.script.run).
 */
function _filaAObjeto(f) {
  var o = { id: f[COL.id - 1] };
  var campos = _camposVoluntarios();
  for (var i = 0; i < campos.length; i++) {
    var c = campos[i];
    var v = f[c.col - 1];
    if (c.col === COL.fechaNac || c.col === COL.fechaIngreso || c.col === COL.fechaRegistro || c.col === COL.ultimaActualizacion) {
      o[c.key] = _fmtFecha(_parseDate(v));
    } else {
      o[c.key] = v === undefined || v === null ? '' : String(v);
    }
  }
  o.nombreCompleto = [o.nombres, o.apPaterno, o.apMaterno].filter(function (s) {
    return String(s).trim();
  }).join(' ');
  return o;
}

/** Busca la fila (índice absoluto) de un voluntario por su ID numérico. @return {Number|null} */
function _filaPorId(ss, id) {
  return _filaPorIdEn(ss.getSheetByName(HOJA.voluntarios), id);
}

/**
 * Extrae el cuerpo numérico de un RUN (dígitos sin DV):
 * '11111111-1' → '11111111'; '11.111.111-1' → '11111111'; '111111111' → '111111111'
 */
function _cuerpoRUN(valor) {
  var limpio = String(valor || '').replace(/\./g, '').trim();
  if (limpio.indexOf('-') !== -1) return limpio.replace(/-/g, '').slice(0, -1);
  return limpio;
}

/**
 * Detecta RUN duplicado en un bloque de filas (batch de columnas 1-3: N°, RUN, Estado).
 * Compara solo el cuerpo numérico (sin DV) para que "11111111-1" ≡ "11.111.111-1".
 * @return {Object|null} {id, estado} del duplicado
 */
function _runDuplicado(existentes, run) {
  var digitos = _cuerpoRUN(run);
  for (var x = 0; x < existentes.length; x++) {
    if (!existentes[x][1]) continue;
    if (_cuerpoRUN(existentes[x][1]) === digitos) {
      return { id: existentes[x][0], estado: existentes[x][2] };
    }
  }
  return null;
}

/** Busca por N°, RUN (con/sin guion) o nombre/apellido (sin acentos). @return {Array} */
function _encontrarVoluntario(ss, query) {
  var sh = ss.getSheetByName(HOJA.voluntarios);
  var ultima = sh.getLastRow();
  if (ultima < PRIMERA_FILA_DATO) return [];
  var datos = sh.getRange(PRIMERA_FILA_DATO, 1, ultima - PRIMERA_FILA_DATO + 1, N_COLS).getValues();
  var q = _norm(query);
  var qLimpio = q.replace(/-/g, '');
  var res = [];
  for (var i = 0; i < datos.length; i++) {
    var f = datos[i];
    if (!f[COL.run - 1] && !f[COL.nombres - 1]) continue;
    var run = _norm(f[COL.run - 1]);
    var nombre = _norm(String(f[COL.nombres - 1]) + ' ' + String(f[COL.apPaterno - 1]) + ' ' + String(f[COL.apMaterno - 1]));
    var idStr = _norm(String(f[COL.id - 1]));
    if (idStr === q || run === q || run.replace(/-/g, '') === qLimpio || nombre.indexOf(q) !== -1) {
      res.push({
        fila: PRIMERA_FILA_DATO + i,
        id: f[COL.id - 1],
        run: f[COL.run - 1],
        nombre: nombre.trim(),
        estado: f[COL.estado - 1]
      });
    }
  }
  return res;
}