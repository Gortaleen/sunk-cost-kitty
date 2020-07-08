/*jslint browser, for, maxlen: 80, single, white*/
/*global Logger, MailApp, PropertiesService, SpreadsheetApp*/

function goToLastRow() {
  'use strict';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var mysheet = ss.getActiveSheet();
  var lastrow = mysheet.getLastRow();
  mysheet.setActiveCell(mysheet.getDataRange().offset(lastrow-1, 0, 1, 1));
}

function onOpen() {
  'use strict';
  goToLastRow();
}

/**
* Read numbers played from the spreadsheet, compare them to the winning
* numbers, then calculate and return the amount of money won.
* 
* @param {string}
*            gameName
* @param {array}
*            prevDrawing
* @return {number} winnings
*/
function getWinnings(gameName, prevDrawing) {
  'use strict';
  var playedArray = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties()
    .getProperties()
    .numbersSpreadsheetId)
  .getSheetByName(gameName)
  .getDataRange()
  .getValues();
  var drawDate = prevDrawing[0];
  var winningNums = prevDrawing[1].split('-');
  var winningGameBall = prevDrawing[3];
  var jackpot = prevDrawing[2].match(/\d+/)[0] * 1000000;
  var winnings = 0;
  var numsMatch = 0;
  var gameBallMatch = '';
  var i = 0;
  for (i = 0; i < playedArray.length; i += 1) {
    numsMatch = 0;
    gameBallMatch = '';
    if (winningNums.indexOf(playedArray[i][0]) >= 0) {
      numsMatch += 1;
    }
    if (winningNums.indexOf(playedArray[i][1]) >= 0) {
      numsMatch += 1;
    }
    if (winningNums.indexOf(playedArray[i][2]) >= 0) {
      numsMatch += 1;
    }
    if (winningNums.indexOf(playedArray[i][3]) >= 0) {
      numsMatch += 1;
    }
    if (winningNums.indexOf(playedArray[i][4]) >= 0) {
      numsMatch += 1;
    }
    gameBallMatch = (playedArray[i][5] === winningGameBall) ? '1' : '0';
    // to do: put game prizes in an object.
    switch (String(numsMatch) + gameBallMatch) {
      case '51':
        winnings += jackpot;
        break;
      case '50':
        winnings += 1000000;
        break;
      case '41':
        if (gameName === 'Mega Millions') {
          winnings += (drawDate > 20171028 ? 10000 : 5000);
        } else if (gameName === 'Powerball') {
          winnings += 50000;
        }
        break;
      case '40':
        if (gameName === 'Mega Millions') {
          winnings += 500;
        } else if (gameName === 'Powerball') {
          winnings += 100;
        }
        break;
      case '31':
        if (gameName === 'Mega Millions') {
          winnings += (drawDate > 20171028 ? 200 : 50);
        } else if (gameName === 'Powerball') {
          winnings += 100;
        }
        break;
      case '30':
        if (gameName === 'Mega Millions') {
          winnings += (drawDate > 20171028 ? 10 : 5);
        } else if (gameName === 'Powerball') {
          winnings += 7;
        }
        break;
      case '21':
        if (gameName === 'Mega Millions') {
          winnings += (drawDate > 20171028 ? 10 : 5);
        } else if (gameName === 'Powerball') {
          winnings += 7;
        }
        break;
      case '11':
        if (gameName === 'Mega Millions') {
          winnings += (drawDate > 20171028 ? 4 : 2);
        } else if (gameName === 'Powerball') {
          winnings += 4;
        }
        break;
      case '01':
        if (gameName === 'Mega Millions') {
          winnings += (drawDate > 20171028 ? 2 : 1);
        } else if (gameName === 'Powerball') {
          winnings += 4;
        }
        break;
    }
  }
  return winnings;
}

/**
* Credit and debit the Kitty spreadsheet with wins and spending on tickets
* respectively.
* 
* @param {string}
*            drawDate
* @param {string}
*            gameName
* @param {number}
*            winnings
*/
function updateAccount(drawDate, gameName, winnings) {
  'use strict';
  var credit = winnings;
  var debit = 0;
  var accountSheet = SpreadsheetApp.getActive()
  .getSheetByName('balance sheet');
  switch (gameName) {
    case 'Mega Millions':
      debit = 20;
      break;
    case 'Powerball':
      debit = 20;
      break;
  }
  accountSheet.appendRow([drawDate, gameName, credit, debit]);
}

/**
* Email the everyone when a games becomes "in play" (i.e., has a jackpot
* greater than or equal to the buyInThreshold) and "in play" game has a
* drawing.
* 
* @param {string}
*            bcc blind copies (comma separated list of email addresses).
* @param {string}
*            msgTxt message body text.
* @param {number}
*            winnings
* @param {number}
*            estJackpot
* @param {number}
*            kittyBalance
* @param {string}
*            lotteryWebUrl
*/
function formatSendEmail(bcc,
                         msgTxt,
                         winnings,
                         estJackpot,
                         kittyBalance,
                         lotteryWebUrl) {
  'use strict';
  // setup email object
  var message = {};
  message.bcc = bcc;
  // message.bcc = 'coemgen.griffin@verizon.net';
  message.name = 'Weekend Lottery';
  message.subject = 'Weekend Lottery Alert';
  message.to = 'kgriffin@meditech.com';
  message.body = msgTxt + '\n'
  + ((winnings === null) ? '' : 'In last night\'s drawing')
  + ((winnings === null) ? '' : ' we won $' + winnings + '.\n')
  + 'The next estimated jackpot is $' + estJackpot + ' Million.\n'
  + 'Kitty balance is now $' + kittyBalance + '.\n' + lotteryWebUrl
  + ' (Chrome authenticated to meditech.com only)';
  message.htmlBody = '<html>' + '<body>' + '<p>' + msgTxt + '<br>'
  + ((winnings === null) ? '' : 'In last night\'s drawing')
  + ((winnings === null) ? '' : ' we won $' + winnings + '.<br>')
  + 'The next estimated jackpot is $' + estJackpot + ' Million.<br>'
  + 'Kitty balance is now $' + kittyBalance + '.</p>' + '<a href="'
  + lotteryWebUrl + '">LotteryWEB</a>'
  + ' (Chrome authenticated to meditech.com only)' + '</body>'
  + '</html>';
  MailApp.sendEmail(message);
  Logger.log(message);
}

/**
* This runs in the early AM after the scheduled drawing and after the estimated
* jackpot has been updated.
* 
* @param {string}
*            gameName
* @param {number}
*            estJackpotRow
*/
function lotteryMailer(gameName) {
  'use strict';
  var drawingSs = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties()
    .getProperties()
    .drawingSpreadsheetId);
  //
  var prevDrawing = drawingSs.getSheetByName(gameName)
  .getSheetValues(
    drawingSs.getSheetByName(gameName)
    .getLastRow(), 1, 1, 7)[0];
  var prevJackpot = prevDrawing[2];
  var drawDate = prevDrawing[0];
  var estJackpot = prevDrawing[6];
  //
  var gameRulesSs = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties()
    .getProperties()
    .gameRulesSpreadsheetId);
  var buyInThreshold = gameRulesSs.getSheetValues(5, 2, 1, 1)[0][0]
  .match(/\d*/)[0];
  //
  var kittySs = SpreadsheetApp.getActive();
  var kittyBalance = kittySs.getSheetByName('balance sheet').getRange(1, 6)
  .getValue();
  var bcc = kittySs.getSheetByName('bcc').getDataRange().getValues()
  .toString();
  var lotteryWebUrl = PropertiesService.getScriptProperties()
  .getProperties()
  .lotteryWebUrl;
  var winnings = getWinnings(gameName, prevDrawing);
  var prevJackpotMult = 1;
  var estJackpotMult = 1;
  // convert jackpot strings (e.g., '$200 Million') to numbers (e.g., 200)
  if (prevJackpot.match(/Billion/i)) {
    prevJackpotMult = 1000;
  }
  if (estJackpot.match(/Billion/i)) {
    estJackpotMult = 1000;
  }
  prevJackpot = Number((prevJackpot.match(/\d+/))[0]) * prevJackpotMult;
  estJackpot = Number((estJackpot.match(/\d+/))[0]) * estJackpotMult;
  if (prevJackpot < buyInThreshold && estJackpot >= buyInThreshold) {
    // send reminder ONLY to buy tickets (i.e., winnings set to null).
    formatSendEmail(bcc,
                    gameName + ' is now in play.',
                    null,
                    estJackpot,
                    kittyBalance,
                    lotteryWebUrl);
  } else if (prevJackpot >= buyInThreshold && estJackpot >= buyInThreshold) {
    // adjust kitty balance to reflect latest drawing.
    if (gameName === 'Mega Millions') {
      kittyBalance -= 20;
    } else if (gameName === 'Powerball') {
      kittyBalance -= 20;
    }
    kittyBalance += winnings;
    // send email with current results and reminder to buy more tickets
    formatSendEmail(bcc,
                    gameName + ' is still in play.',
                    winnings,
                    estJackpot,
                    kittyBalance,
                    lotteryWebUrl);
    // update kitty account
    updateAccount(drawDate, gameName, winnings);
  } else if (prevJackpot >= buyInThreshold && estJackpot < buyInThreshold) {
    // adjust kitty balance to reflect latest drawing.
    if (gameName === 'Mega Millions') {
      kittyBalance -= 20;
    } else if (gameName === 'Powerball') {
      kittyBalance -= 20;
    }
    kittyBalance += winnings;
    // email results and notify this run is over
    formatSendEmail(bcc,
                    'The latest ' + gameName + ' run has ended.',
                    winnings,
                    estJackpot,
                    kittyBalance,
                    lotteryWebUrl);
    // update kitty account
    updateAccount(drawDate, gameName, winnings);
  }
  Logger.log(bcc);
  Logger.log(MailApp.getRemainingDailyQuota());
  Logger.log('%s %s', prevJackpot, estJackpot);
}

function megaMillionsMailer() {
  'use strict';
  lotteryMailer('Mega Millions');
}

function powerballMailer() {
  'use strict';
  lotteryMailer('Powerball');
}
