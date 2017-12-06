/*jslint
browser, devel, maxlen: 80, white
*/
/*global
DEBUG, Logger, MailApp, PropertiesService, SpreadsheetApp, utils
*/

//******************************************************************************
//
// TODO: add kitty balance
//

var mail = (function () {
  "use strict";
  
  var wins;
  var newDrawingsObj;
  var gamesObj;
  
  function getAlerts() {
    // Return alert texts for newly (in)active games.
    return Object.keys(newDrawingsObj)  // object key is gameName
    .map(
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
          + currDraw.nextDate + " is " + currDraw.estJackpot + ".";
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
        Logger.log("%s %s", str, str.length);
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
  function send(arg0, arg1, arg2) {
    var alertArr;
    var bcc;
    var body;
    var cc;  // copies is comma-separated string
    var htmlBody;
    var kittyBalance;
    var options;
    var recipient = Session.getActiveUser().getEmail();
    var scriptProperties = PropertiesService.getScriptProperties()
    .getProperties();
    var subject = scriptProperties.projectName;

    bcc = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("bcc")
    .getDataRange()
    .getValues()
    .toString()

    wins = arg0;
    newDrawingsObj = arg1;
    gamesObj = arg2;
    
    alertArr = getAlerts();
    
    body = wins.reduce(
      function (str, win) {
        var date = new Date(win[0]);
        return str + date.toDateString() + "\t" +
          win[1] + "\t$" + win[2] + "\n";
      }, "Recent results (Date, Game, Winnngs):\n");
    alertArr.forEach(
      function (alertStr) {
        body += alertStr + "\n";
      });
    
    htmlBody = wins.reduce(
      function (str, win) {
        var date = new Date(win[0]);
        return str + "<p>" + date.toDateString() + "&nbsp;" +  
          // TODO: add symbols
          // e.g., frowny face &#9785; dollar sign &#36;
          win[1] + "&nbsp;winnings&nbsp;&#36;" + win[2] + "</p>";
      }, "<h4>Recent results (Date, Game, Winnings):</h4>");
    alertArr.forEach(
      function (alertStr) {
        htmlBody += "<p>" + alertStr + "</p>";
      });
    
    // TODO: add kitty balance
    kittyBalance = utils.numToUSD(SpreadsheetApp.getActive()
    .getSheetByName("Balance Sheet")
    .getRange("F1")
    .getValue());
    body += "Kitty Balance: " + kittyBalance + "\n";
    htmlBody += "<p>Kitty Balance: " + kittyBalance + "</p>";
    
    // TODO: add webpage email
    body += scriptProperties.lotteryWebUrl + "\n";
    htmlBody += "<a href=\"" + scriptProperties.lotteryWebUrl + "\">" 
    + scriptProperties.projectName + "</a>"; 
    
    options = {
      bcc: bcc,
      cc: cc,
      htmlBody: htmlBody,
      name: scriptProperties.projectName,
      noReply: true
    };
    
    if (wins.length === 0) {
      return;
    }
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