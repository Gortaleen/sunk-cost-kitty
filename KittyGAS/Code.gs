/*******************************************************************************
1. Separate HTML, CSS, and JS etc.
https://developers.google.com/apps-script/guides/html/best-practices
2. CSS, HTML indentation etc.
http://google-styleguide.googlecode.com/svn/trunk/htmlcssguide.xml
http://cssguidelin.es/#naming-conventions
2. JavaScript indentation etc.
http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
3. Get jquery from Google's Content Delivery Network:
https://developers.google.com/speed/libraries/devguide#jquery
4.
http://www.w3schools.com/js/js_best_practices.asp
http://contribute.jquery.org/style-guide/js/
5. Use windows.x for globals when in NATIVE or EMULATED modes etc.
https://developers.google.com/apps-script/guides/html/restrictions
6. Crap (i.e., lint) detectors:
http://jslint.com/
http://jshint.com/
https://developers.google.com/closure/
7. Caja restrictions
https://developers.google.com/apps-script/guides/html/restrictions#css
8. LotteryWEB LIVE urls:
   a. private Google account:
https://script.google.com/macros/s/AKfycbwn4Nvaq7W6Kr8BCvSQW-_ar87Nh1HnZ3ACqZCdTW0Q4h4l8RYJ/exec
   b. meditech Google account:
https://script.google.com/a/macros/meditech.com/s/AKfycbzKNfcDTO7NiVVGGcdM_7DksckZpQd9bxcsX8d86cRh6_obzIbf/exec
 *******************************************************************************/

/*
 Proposed description/algorithm:
 1. Web page to enter paid statuses and update the kitty account balances.
 2. Trigger events for $100 million+ drawings:
 a. when estimated jackpot is $100 million+, send email (everyone in group or
 admins only?).
 b. after drawing deduct from kitty 20 tickets X $2 for powerball or $1 for
 mega millions.
 c. after drawing add winnings to kitty.
 3. Trigger event to send email when kitty goes below a certain value.
 */

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
    var numbersSsId = PropertiesService.getScriptProperties()
            .getProperty('numbersSpreadsheetId'), playedArray = SpreadsheetApp
            .openById(numbersSsId).getSheetByName(gameName).getDataRange()
            .getValues(), winningNums = prevDrawing.slice(1, 6), winningGameBall = prevDrawing[7], jackpot = prevDrawing[8]
            .match(/\d+/)[0] * 1000000, winnings = 0, numsMatch = 0, gameBallMatch = '', i = 0;
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
        // TODO: put game prizes in an object.
        switch (String(numsMatch) + gameBallMatch) {
        case '51':
            winnings += jackpot;
            break;
        case '50':
            winnings += 1000000;
            break;
        case '41':
            if (gameName === 'Mega Millions') {
                winnings += 5000;
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
                winnings += 50;
            } else if (gameName === 'Powerball') {
                winnings += 100;
            }
            break;
        case '30':
            if (gameName === 'Mega Millions') {
                winnings += 5;
            } else if (gameName === 'Powerball') {
                winnings += 7;
            }
            break;
        case '21':
            if (gameName === 'Mega Millions') {
                winnings += 5;
            } else if (gameName === 'Powerball') {
                winnings += 7;
            }
            break;
        case '11':
            if (gameName === 'Mega Millions') {
                winnings += 2;
            } else if (gameName === 'Powerball') {
                winnings += 4;
            }
            break;
        case '01':
            if (gameName === 'Mega Millions') {
                winnings += 1;
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
    var credit = winnings, debit = 0, kittySsId = PropertiesService
            .getScriptProperties().getProperty('kittySpreadsheetId'), accountSheet = SpreadsheetApp
            .openById(kittySsId).getSheetByName('balance sheet');
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
function lotteryMailer(gameName, estJackpotRow, buyInThreshold) {
    'use strict';
    // get previous jackpot values
    var scriptProps = PropertiesService.getScriptProperties().getProperties(), drawingSs = SpreadsheetApp
            .openById(scriptProps.drawingSpreadsheetId), prevDrawing = drawingSs
            .getSheetByName(gameName).getRange(2, 1, 1, 9).getValues()[0], prevJackpot = prevDrawing[8], drawDate = prevDrawing[0], estJackpot = drawingSs
            .getSheetByName('Estimated Jackpots').getRange(estJackpotRow, 3)
            .getValue(), kittySs = SpreadsheetApp
            .openById(scriptProps.kittySpreadsheetId), kittyBalance = kittySs
            .getSheetByName('balance sheet').getRange(1, 6).getValue(), bcc = kittySs
            .getSheetByName('bcc').getDataRange().getValues().toString(), lotteryWebUrl = scriptProps.lotteryWebUrl, winnings = getWinnings(gameName,
                                                                                                                                            prevDrawing), prevJackpotMult = 1, estJackpotMult = 1;
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
    lotteryMailer('Mega Millions', 2, 90);
}

function powerballMailer() {
    'use strict';
    lotteryMailer('Powerball', 3, 100);
}
