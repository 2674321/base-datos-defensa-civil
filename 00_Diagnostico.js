function describeSpreadsheet() {
  var ss = SpreadsheetApp.openById(getSpreadsheetId_());
  var out = {
    title: ss.getName(),
    timezone: Session.getScriptTimeZone(),
    sheets: []
  };
  ss.getSheets().forEach(function (sheet) {
    var info = {
      name: sheet.getName(),
      rows: sheet.getMaxRows(),
      cols: sheet.getMaxColumns()
    };
    var lastRow = sheet.getLastRow();
    if (lastRow > 0) {
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      info.headers = headers;
      info.dataRows = lastRow - 1;
    }
    out.sheets.push(info);
  });
  console.log(JSON.stringify(out));
  return JSON.stringify(out);
}