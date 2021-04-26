/*jslint
browser:true, white:true
*/
/*global
DEBUG, Logger, MailApp, PropertiesService, Session, SpreadsheetApp, utils
*/

//******************************************************************************

// eslint-disable-next-line no-unused-vars
var mail = (function () {
  "use strict";

  var wins = [];
  var newDrawingsObj = {};
  var gamesObj = {};

  function getAlerts() {
    // Return alert texts for newly (in)active games.
    return Object.keys(newDrawingsObj) // object key is gameName
      .map(
        // eslint-disable-next-line max-statements
        function checkActive(gameName) {
          var currDraw = newDrawingsObj[gameName].slice(-1)[0];
          var estJackpot;
          var jackpot;
          var newlyActive;
          var newlyInactive;
          var threshold;

          if (currDraw === null
            || currDraw === undefined
            || currDraw === "") {
            return "";
          }
          if (gamesObj[gameName].threshold === null
            || gamesObj[gameName].threshold === undefined
            || gamesObj[gameName].threshold === "") {
            return "";
          }
          if (currDraw.jackpot === null
            || currDraw.jackpot === undefined
            || currDraw.jackpot === "") {
            return "";
          }
          if (currDraw.estJackpot === null
            || currDraw.estJackpot === undefined
            || currDraw.estJackpot === "") {
            return "";
          }

          jackpot = utils.dollarsToNum(currDraw.jackpot);
          estJackpot = utils.dollarsToNum(currDraw.estJackpot);
          threshold = utils.dollarsToNum(gamesObj[gameName].threshold);

          // check for newly active game
          newlyActive = jackpot < threshold && threshold <= estJackpot;
          if (newlyActive === true) {
            return gameName + " is now active. The estimated jackpot for "
              + currDraw.nextDate.toDateString()
              + " is "
              + utils.numToUSD(estJackpot)
              + ".";
          }

          // check for newly inactive game
          newlyInactive = jackpot >= threshold && threshold > estJackpot;
          if (newlyInactive === true) {
            return "The current " + gameName + " run has ended.";
          }

          return "";
        })
      .filter(
        function validText(str) {
          Logger.log("getAlerts: %s %s", str, str.length);
          return str.length > 0;
        });
  }

  /**
   * @param {object} wins - [[date.getTime(),gameName,winnings,#of plays],...]
   * @param {object} nextDrawingsObj - {name:[{date,numArr,jackpot,ball,bonus,
   *                                           nextDate,estJackpot},...],...
   *                                    }
   * @param {object} gamesObj - {name: {threshold, price, rules},...}
   */
  // eslint-disable-next-line max-statements
  function send(arg0, arg1, arg2) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var alertArr = [];
    var bcc = "";
    var body = "";
    var cc = ""; // copies is comma-separated string
    var curDate = {};
    var htmlBody = "";
    var kittyBalance = 0;
    var options = {};
    var recipient = "";
    var scriptProperties = {};
    var subject = "";
    var emojis = [];

    wins = arg0;
    newDrawingsObj = arg1;
    gamesObj = arg2;
    // getAlerts uses newDrawingsObj and gamesObj
    alertArr = getAlerts();
    if (wins.length === 0 && alertArr.length === 0) {
      return;
    }

    curDate = new Date();
    recipient = Session.getActiveUser().getEmail();
    scriptProperties = PropertiesService.getScriptProperties()
      .getProperties();
    subject = scriptProperties.projectName;
    bcc = ss.getSheetByName("bcc")
      .getDataRange()
      .getValues()
      .toString();
    emojis = ss.getSheetByName("Google Emoji Codes")
      .getDataRange()
      .getValues();

    body = wins.reduce(
      function (str, win) {
        var date = new Date(win[0]);
        return str + date.toDateString() + "\t"
          + win[1] + "\t"
          + utils.numToUSD(win[2]) + "\n";
      }, "Recent results (Date, Game, Winnngs):\n");
    alertArr.forEach(
      function (alertStr) {
        body += alertStr + "\n";
      });

    htmlBody = wins.reduce(
      function (str, win) {
        var date = new Date(win[0]);
        // TODO: add symbols
        // e.g., frowny face &#9785; dollar sign &#36;
        return str + "<p>" + date.toDateString() + "&nbsp;"
          + win[1] + "&nbsp;winnings&nbsp;" + utils.numToUSD(win[2]) + "</p>";
      }, "<h4>Recent results (Date, Game, Winnings):</h4>");
    alertArr.forEach(
      function (alertStr) {
        htmlBody += "<p>" + alertStr + "</p>";
      });

    // add kitty balance
    kittyBalance = utils.numToUSD(SpreadsheetApp.getActive()
      .getSheetByName("Balance Sheet")
      .getRange("F1")
      .getValue());
    body += "Kitty Balance: " + kittyBalance + "\n";
    htmlBody += "<p>Kitty Balance: " + kittyBalance + "</p>";

    // webpage email
    body += scriptProperties.lotteryWebUrl + "\n";
    htmlBody += "<a href=\"" + scriptProperties.lotteryWebUrl + "\">"
      + "View " + scriptProperties.projectName + " details</a>";
    // work-around for gmail "show trimmed content" issue
    htmlBody += "<p>" + curDate + "</p>";
    // pseudo rebus
    htmlBody += emojis[Math.floor(Math.random() * emojis.length)][1];
    htmlBody += emojis[Math.floor(Math.random() * emojis.length)][1];
    htmlBody += emojis[Math.floor(Math.random() * emojis.length)][1];
    htmlBody += emojis[Math.floor(Math.random() * emojis.length)][1];
    htmlBody += emojis[Math.floor(Math.random() * emojis.length)][1];

    options = {
      bcc: bcc,
      cc: cc,
      htmlBody: htmlBody,
      name: scriptProperties.projectName,
      noReply: false
    };

    if (DEBUG === true) {
      Logger.log("%s %s %s %s\n", recipient, subject, body, options);
      //    debugger;
      return;
    }
    MailApp.sendEmail(recipient, subject, body, options);
  }

  return {
    send: send
  };

}());
