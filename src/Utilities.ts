/*jslint
    browser, devel, maxlen: 80, white
*/
/*global
    Logger, MailApp, PropertiesService, SpreadsheetApp
*/

//********************************* Utilities **********************************

var utils = (function () {
  "use strict";

  function dollarsToNum(dollars) {
    if (typeof dollars === "number") {
      return dollars;
    }
    if (dollars.match(/^\d+$/)) {
      return Number(dollars);
    }
    if (dollars.match(/^\$\d+(,\d{3})*(\.\d+)?$/)) {
      return Number(
        dollars.match(/\d+(,\d{3})*(\.\d+)?$/)[0]
          .replace(/,/g, "")
      );
    }
    if (dollars.match(/^\$\d+(,\d{3})*(\.\d+)?\sMillion$/)) {
      return Number(
        dollars.match(/\d+(,\d{3})*(\.\d+)?/)[0].replace(/,/g, "")
      ) * 1000000;
    }
    if (dollars.match(/^\$\d+(,\d{3})*(\.\d+)?\sBillion$/)) {
      return Number(
        dollars.match(/\d+(,\d{3})*(\.\d+)?/)[0].replace(/,/g, "")
      ) * 1000000000;
    }
    return undefined;
  }

  /**
  * @returns {object} today's with hours,minutes,seconds,and ms set to 0.
  */
  function getSimpleDate() {
    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    return today;
  }

  function numToUSD(numStr) {
    const num = Number(numStr);
    const dollars = (
      (num < 1000000)
        ? num.toLocaleString("en-US", {
          currency: "USD",
          style: "currency",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })
        : num.toLocaleString("en-US", {
          currency: "USD",
          style: "currency",
          notation: "compact",
          minimumSignificantDigits: 3
        })
    );
    const matchResult = dollars.match(/^(\$\d+(\.\d+)?)([BM])$/);
    const formattedResult = (
      (matchResult)
        ? matchResult[1] + " " + matchResult[3] + "illion"
        : dollars
    );

    return formattedResult;
  }

  return {
    dollarsToNum: dollarsToNum,
    getSimpleDate: getSimpleDate,
    numToUSD: numToUSD
  };

}());

//******************************************************************************

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

//******************************************************************************
