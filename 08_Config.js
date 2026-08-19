/**
 * 08_Config.js — Menús, inicialización y creación de la estructura base.
 * crearEstructuraBase crea/actualiza todas las hojas con migración segura de columnas.
 */

function onOpen() {
  try {
    crearMenus();
  } catch (err) {
    console.error('onOpen: ' + err);
  }
}

function crearMenus() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📋 Voluntarios')
    .addItem('➕ Registrar (fila 2)', 'registrarVoluntario')
    .addItem('🔍 Buscar voluntario', 'buscarVoluntario')
    .addItem('📝 Dar de baja (Egresado)', 'menuDarDeBajaVoluntario')
    .addSeparator()
    .addItem('🔢 Renumerar IDs', 'renumerarVoluntarios')
    .addToUi();
  ui.createMenu('📦 Equipamiento')
    .addItem('➕ Registrar elemento (fila 2)', 'menuRegistrarElemento')
    .addItem('📥 Entrada de inventario (fila 2)', 'menuRegistrarEntradaInventario')
    .addItem('📤 Registrar entrega (fila 2)', 'menuRegistrarEntrega')
    .addItem('↩️ Registrar devolución', 'menuRegistrarDevolucion')
    .addItem('🔍 Buscar elemento', 'menuBuscarElemento')
    .addItem('📦 Equipamiento de voluntario', 'menuEquipamientoVoluntario')
    .addToUi();
  ui.createMenu('⚙️ Sistema')
    .addItem('🛠️ Crear estructura base', 'crearEstructuraBase')
    .addItem('🧪 Ejecutar pruebas', 'ejecutarPruebas')
    .addToUi();
}

function crearEstructuraBase() {
  var ss = _ss();
  var ui = SpreadsheetApp.getUi();
  var resp = ui.alert('Crear estructura base', 'Se crearán o repararán las pestañas:\n- ' + HOJA.voluntarios + '\n- ' + HOJA.catalogo + '\n- ' + HOJA.inventario + '\n- ' + HOJA.entregas + '\n- ' + HOJA.config + '\n- ' + HOJA.log + '\n\n¿Continuar?', ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) return;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    ss.toast('Ocupado, reintenta en unos segundos', '⚠️', 5);
    return;
  }
  try {
    _crearHojaVoluntarios(ss);
    _crearHojaCatalogo(ss);
    _crearHojaInventario(ss);
    _crearHojaEntregas(ss);
    _crearHojaConfig(ss);
    _crearHojaLog(ss);
    _organizarHojas(ss);
    crearMenus();
    _log(ss, 'Sistema', 'crearEstructuraBase', 'OK', PROYECTO.version);
    ss.toast('Estructura base lista ✔', PROYECTO.nombre, 6);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Migración segura de columnas: inserta columnas solo si el encabezado esperado
 * no existe en la hoja (no borra ni reordena datos). Al final escribe los
 * encabezados objetivo.
 */
function _migrarColumnas(sh, encabezados) {
  var nActual = sh.getLastColumn();
  var actuales = nActual > 0 ? sh.getRange(1, 1, 1, nActual).getValues()[0] : [];
  for (var i = 0; i < encabezados.length; i++) {
    var esperado = encabezados[i];
    if (String(actuales[i] || '') === esperado) continue;
    var existe = false;
    for (var j = 0; j < actuales.length; j++) {
      if (String(actuales[j] || '') === esperado) { existe = true; break; }
    }
    if (existe) continue; // encabezado existente pero desplazado: no reordenar
    sh.insertColumnBefore(i + 1);
    actuales.splice(i, 0, ''); // mantener sincronía con la hoja
  }
  sh.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
}

function _crearHojaVoluntarios(ss) {
  var sh = ss.getSheetByName(HOJA.voluntarios);
  if (!sh) sh = ss.insertSheet(HOJA.voluntarios, 0);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, N_COLS).setValues([ENCABEZADOS]);
    sh.setFrozenRows(1);
  } else {
    _migrarColumnas(sh, ENCABEZADOS);
  }
  _estilizarEncabezado(sh, 1, N_COLS);
  sh.getRange(FILA_ENTRADA, 1, 1, N_COLS).setBackground(COLOR.filaEntrada);
  sh.getRange(FILA_ENTRADA, 1).setNote('Escribe aquí un nuevo voluntario y usa el menú 📋 Voluntarios → Registrar (fila ' + FILA_ENTRADA + ').');
  _aplicarValidacionesVoluntarios(ss, sh);
  _aplicarFormatoFechas(sh);
  _ajustarAnchos(sh);
}

function _crearHojaCatalogo(ss) {
  var sh = ss.getSheetByName(HOJA.catalogo);
  if (!sh) sh = ss.insertSheet(HOJA.catalogo, 1);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, N_COLS_CATALOGO).setValues([ENCABEZADOS_CATALOGO]);
    sh.setFrozenRows(1);
    // Catálogo inicial: solo los 12 elementos conocidos. Sin stock ni tallas inventadas.
    var filas = [];
    for (var i = 0; i < CATALOGO_INICIAL.length; i++) {
      var id = _siguienteIdPrefijo(filas.map(function (f) { return f[0]; }), ID_PREFIJOS.catalogo);
      filas.push([id, CATALOGO_INICIAL[i][0], '', CATALOGO_INICIAL[i][1], CATALOGO_INICIAL[i][2], true, '']);
    }
    sh.getRange(2, 1, filas.length, N_COLS_CATALOGO).setValues(filas);
  }
  _estilizarEncabezado(sh, 1, N_COLS_CATALOGO);
  sh.getRange(FILA_ENTRADA, 1, 1, N_COLS_CATALOGO).setBackground(COLOR.filaEntrada);
  sh.getRange(FILA_ENTRADA, 1).setNote('Escribe aquí un nuevo tipo de elemento y usa el menú 📦 Equipamiento → Registrar elemento (fila ' + FILA_ENTRADA + ').');
  _aplicarFormatoCatalogo(ss, sh);
}

function _crearHojaInventario(ss) {
  var sh = ss.getSheetByName(HOJA.inventario);
  if (!sh) sh = ss.insertSheet(HOJA.inventario, 2);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, N_COLS_INVENTARIO).setValues([ENCABEZADOS_INVENTARIO]);
    sh.setFrozenRows(1);
  }
  _estilizarEncabezado(sh, 1, N_COLS_INVENTARIO);
  sh.getRange(FILA_ENTRADA, 1, 1, N_COLS_INVENTARIO).setBackground(COLOR.filaEntrada);
  sh.getRange(FILA_ENTRADA, 1).setNote('Escribe aquí una entrada de existencias reales y usa el menú 📦 Equipamiento → Entrada de inventario (fila ' + FILA_ENTRADA + ').');
  _aplicarFormatoInventario(ss, sh);
}

function _crearHojaEntregas(ss) {
  var sh = ss.getSheetByName(HOJA.entregas);
  if (!sh) sh = ss.insertSheet(HOJA.entregas, 3);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, N_COLS_ENTREGA).setValues([ENCABEZADOS_ENTREGA]);
    sh.setFrozenRows(1);
  }
  _estilizarEncabezado(sh, 1, N_COLS_ENTREGA);
  sh.getRange(FILA_ENTRADA, 1, 1, N_COLS_ENTREGA).setBackground(COLOR.filaEntrada);
  sh.getRange(FILA_ENTRADA, 1).setNote('Escribe aquí Voluntario ID, Inventario ID y Cantidad, y usa el menú 📦 Equipamiento → Registrar entrega (fila ' + FILA_ENTRADA + ').');
  _aplicarFormatoEntregas(ss, sh);
}

function _estilizarEncabezado(sh, fila, nCols) {
  sh.getRange(fila, 1, 1, nCols)
    .setFontWeight('bold')
    .setBackground(COLOR.encabezado)
    .setFontColor(COLOR.encabezadoTexto)
    .setVerticalAlignment('middle');
}

function _aplicarValidacionesVoluntarios(ss, sh) {
  var desde = FILA_ENTRADA;
  var total = sh.getMaxRows() - desde + 1;

  var aplicar = function (col, regla) {
    sh.getRange(desde, col, total, 1).setDataValidation(regla);
  };

  var estados = _configLista(ss, 'ESTADOS');
  if (estados.length) {
    aplicar(COL.estado, SpreadsheetApp.newDataValidation().requireValueInList(estados, true).build());
  }
  var categorias = _configLista(ss, 'CATEGORIAS');
  if (categorias.length) {
    aplicar(COL.categoria, SpreadsheetApp.newDataValidation().requireValueInList(categorias, true).build());
  }
  var sexos = _configLista(ss, 'SEXOS');
  if (sexos.length) {
    aplicar(COL.sexo, SpreadsheetApp.newDataValidation().requireValueInList(sexos, true).build());
  }
  var cargos = _configLista(ss, 'CARGO');
  if (cargos.length) {
    aplicar(COL.cargo, SpreadsheetApp.newDataValidation().requireValueInList(cargos, true).build());
  }

  var fechaRegla = SpreadsheetApp.newDataValidation().requireDate().build();
  aplicar(COL.fechaNac, fechaRegla);
  aplicar(COL.fechaIngreso, fechaRegla);
  aplicar(COL.fechaRegistro, fechaRegla);
  aplicar(COL.ultimaActualizacion, fechaRegla);
}

function _aplicarFormatoFechas(sh) {
  var desde = FILA_ENTRADA;
  var total = sh.getMaxRows() - desde + 1;
  sh.getRange(desde, COL.fechaNac, total, 1).setNumberFormat(FMT_FECHA);
  sh.getRange(desde, COL.fechaIngreso, total, 1).setNumberFormat(FMT_FECHA);
  sh.getRange(desde, COL.fechaRegistro, total, 1).setNumberFormat(FMT_FECHA);
  sh.getRange(desde, COL.ultimaActualizacion, total, 1).setNumberFormat(FMT_FECHA);
}

function _ajustarAnchos(sh) {
  var anchos = [6, 13, 20, 18, 18, 14, 10, 13, 24, 24, 14, 22, 14, 13, 12, 16, 18, 34, 14, 14];
  for (var i = 0; i < anchos.length; i++) {
    sh.setColumnWidth(i + 1, anchos[i]);
  }
}

function _crearHojaConfig(ss) {
  var sh = ss.getSheetByName(HOJA.config);
  if (!sh) sh = ss.insertSheet(HOJA.config, 4);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, CONFIG_DEF.length, 4).setValues(CONFIG_DEF);
    sh.setFrozenRows(1);
  } else {
    // Migración: agrega parámetros nuevos de CONFIG_DEF que falten (sin tocar existentes)
    var ult = sh.getLastRow();
    var existentes = sh.getRange(1, 1, ult, 1).getValues();
    var nombres = {};
    for (var i = 1; i < existentes.length; i++) nombres[String(existentes[i][0] || '').toUpperCase()] = true;
    var faltantes = [];
    for (var j = 1; j < CONFIG_DEF.length; j++) {
      if (!nombres[String(CONFIG_DEF[j][0]).toUpperCase()]) faltantes.push(CONFIG_DEF[j]);
    }
    if (faltantes.length) sh.getRange(ult + 1, 1, faltantes.length, 4).setValues(faltantes);
  }
  _estilizarEncabezado(sh, 1, 4);
  sh.getRange(2, 1, CONFIG_DEF.length - 1, 1).setFontWeight('bold');
  sh.setColumnWidth(1, 16);
  sh.setColumnWidth(2, 44);
  sh.setColumnWidth(3, 8);
  sh.setColumnWidth(4, 60);
  sh.getRange(2, 2, CONFIG_DEF.length - 1, 1).setNote('El usuario puede editar solo esta columna (Valor).');
}

function _crearHojaLog(ss) {
  var sh = ss.getSheetByName(HOJA.log);
  if (!sh) sh = ss.insertSheet(HOJA.log, 5);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, 5).setValues([['Timestamp', 'Página', 'Evento', 'Resultado', 'Detalle']]);
  }
  _estilizarEncabezado(sh, 1, 5);
  sh.setColumnWidth(1, 160);
  sh.setColumnWidth(2, 18);
  sh.setColumnWidth(3, 24);
  sh.setColumnWidth(4, 12);
  sh.setColumnWidth(5, 60);
}

function _organizarHojas(ss) {
  var orden = [HOJA.voluntarios, HOJA.catalogo, HOJA.inventario, HOJA.entregas, HOJA.config, HOJA.log];
  for (var i = 0; i < orden.length; i++) {
    var sh = ss.getSheetByName(orden[i]);
    if (sh) {
      ss.setActiveSheet(sh);
      ss.moveActiveSheet(i + 1);
    }
  }
}