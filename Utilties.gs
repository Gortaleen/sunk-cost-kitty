function fixDatesUtil() {
  "use strict";
  var kittyBalanceSheet = SpreadsheetApp.getActive()
  .getSheetByName("Balance Sheet");
  var kittyBalanceArr = kittyBalanceSheet.getDataRange()
  .getValues();
  kittyBalanceArr.forEach(
    function (kittyRow, index) {
      var row = index + 1;
      var column = 1;
      var numRows = 1;
      var numColumns = 1;
      var date = {};
      var dateNumStr = "";
      if (typeof kittyRow[0] === "number") {
        dateNumStr = kittyRow[0].toString();
        date = new Date(dateNumStr.slice(0, 4), 
                        dateNumStr.slice(4, 6), 
                        dateNumStr.slice(6, 8));
        kittyBalanceSheet.getRange(row, column, numRows, numColumns)
        .setValue(date);
      }
    });
}
