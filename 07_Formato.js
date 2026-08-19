/**
 * 07_Formato.js — Formato y validaciones de Catálogo, Inventario y Entregas.
 * Usado por crearEstructuraBase (08_Config.js). La validación en celda es auxiliar:
 * las reglas de negocio reales viven en el backend (05_Entregas.js).
 */

function _aplicarFormatoCatalogo(ss, sh) {
  var desde = FILA_ENTRADA;
  var total = sh.getMaxRows() - desde + 1;
  var tipos = _configLista(ss, 'TIPOS_ELEMENTO');
  if (tipos.length) {
    sh.getRange(desde, COL_CATALOGO.tipo, total, 1)
      .setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(tipos, true).build());
  }
  var chk = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  sh.getRange(desde, COL_CATALOGO.requiereTalla, total, 1).setDataValidation(chk);
  sh.getRange(desde, COL_CATALOGO.requiereDevolucion, total, 1).setDataValidation(chk);
  sh.getRange(desde, COL_CATALOGO.activo, total, 1).setDataValidation(chk);
  sh.setColumnWidths(1, N_COLS_CATALOGO, 120);
  sh.setColumnWidths(2, 1, 220);
}

function _aplicarFormatoInventario(ss, sh) {
  var desde = FILA_ENTRADA;
  var total = sh.getMaxRows() - desde + 1;
  sh.getRange(desde, COL_INVENTARIO.estado, total, 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(ESTADOS_INVENTARIO, true).build());
  sh.getRange(desde, COL_INVENTARIO.cantidad, total, 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).build());
  sh.setColumnWidths(1, N_COLS_INVENTARIO, 110);
  sh.setColumnWidths(2, 1, 160);
  sh.setColumnWidths(4, 1, 90);
}

function _aplicarFormatoEntregas(ss, sh) {
  var desde = FILA_ENTRADA;
  var total = sh.getMaxRows() - desde + 1;
  sh.getRange(desde, COL_ENTREGA.estado, total, 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(ESTADOS_ENTREGA, true).build());
  sh.getRange(desde, COL_ENTREGA.cantidad, total, 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).build());
  sh.getRange(desde, COL_ENTREGA.cantidadDevuelta, total, 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).build());
  sh.getRange(desde, COL_ENTREGA.cantidadDanada, total, 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).build());
  sh.getRange(desde, COL_ENTREGA.cantidadExtraviada, total, 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).build());
  var fechaRegla = SpreadsheetApp.newDataValidation().requireDate().build();
  sh.getRange(desde, COL_ENTREGA.fechaEntrega, total, 1).setDataValidation(fechaRegla);
  sh.getRange(desde, COL_ENTREGA.fechaDevolucion, total, 1).setDataValidation(fechaRegla);
  sh.getRange(desde, COL_ENTREGA.fechaEntrega, total, 1).setNumberFormat(FMT_FECHA);
  sh.getRange(desde, COL_ENTREGA.fechaDevolucion, total, 1).setNumberFormat(FMT_FECHA);
  sh.setColumnWidths(1, N_COLS_ENTREGA, 100);
  sh.setColumnWidths(3, 1, 180);
  sh.setColumnWidths(7, 1, 170);
}