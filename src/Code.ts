// TODO: Add names for "inline" functions used as callbacks for map, etc.
// TODO: fix jsdoc comments
// TODO: work on JS Module Patterns
//

const DEBUG = false;

interface DrawingData {
  date: Date;
  numArr: Array<string>;
  jackpot: string;
  ball: string;
  bonus: string;
  nextDate: Date;
  estJackpot: string;
}
interface Game {
  threshold: number;
  price: number;
  rules: Array<string>;
}

const updateKitty = (function () {
  /**
   * Returns game payouts indexed by ball match patterns.
   * @example
   * // returns {"31":"$1,000","11":"$100"}
   * rulesArrToObj([["match","31","$1,000"],["match,"11","$100"]);
   *
   * @param {object} rulesArr - 2d array of ball match patterns with payouts.
   * @returns {object} an object composed of payouts indexed by match patterns.
   */
  function rulesArrToObj(rulesArr: Array<Array<string>>) {
    "use strict";
    return rulesArr
      .filter(function getMatchRules(curVal) {
        return curVal[0] === "match";
      })
      .reduce(function matchRulesArrToObj(obj, arr) {
        // arr == ["match", pattern, payout]
        // obj == {{pattern: payout}, ... }
        let nam = "";
        let val = "";

        if (arr[1].length === 1) {
          nam = "0" + arr[1];
        } else {
          nam = arr[1];
        }

        if (arr[2] === "JACKPOT") {
          val = arr[2].toLowerCase();
        } else {
          val = arr[2];
        }

        Object.defineProperty(obj, nam, { value: val });
        return obj;
      }, {});
  }

  /**
   * Returns rules and parameters for all games played.
   *
   * @returns {object} {game name: {threshold, price, rules}, ... }
   */
  function getGames() {
    "use strict";
    const ss = SpreadsheetApp.openById(
      PropertiesService.getScriptProperties().getProperties()
        .gameRulesSpreadsheetId,
    );
    return ss.getSheets().reduce(function gameArrToObj(obj, sheetObj) {
      const detailsArr: Array<Array<string>> = sheetObj
        .getDataRange()
        .getDisplayValues();
      Object.defineProperty(obj, detailsArr[1][1], {
        value: {
          threshold: detailsArr[4][1] || "$0",
          price: detailsArr[5][1],
          rulesMap: rulesArrToObj(detailsArr.slice(6)),
        },
      });

      return obj;
    }, {});
  }

  //**************************** Process Game Plays ******************************

  /**
   * Returns played numbers indexed by game name.
   *
   * @returns {object} {game:[{numArr,ball,bonus,startDt,endDt},...],...}
   */
  function getPlays() {
    "use strict";
    const today = utils.getSimpleDate();
    let start = {};
    let end = {};
    return SpreadsheetApp.openById(
      PropertiesService.getScriptProperties().getProperties()
        .playsSpreadsheetId,
    )
      .getSheets()
      .reduce(function playArrToObj(obj, sheet) {
        const playsArr = sheet.getDataRange().getDisplayValues();
        const playObjsArr = playsArr
          .slice(1)
          .map(function putPlaysInObj(playArr) {
            let ticketCost = "";
            if (
              playArr[10] !== null &&
              playArr[10] !== undefined &&
              playArr[10] !== "" &&
              playArr[10] !== "0"
            ) {
              ticketCost = playArr[10];
            } else {
              ticketCost = "";
            }
            start = playArr[8] ? new Date(playArr[8]) : today;
            end = playArr[9] ? new Date(playArr[9]) : today;
            return {
              numArr: playArr
                .slice(0, 6)
                .filter(function removeFalsy(num) {
                  return num;
                })
                .map(function padToTwoDigits(num) {
                  if (num.length === 1) {
                    return "0" + num;
                  }
                  return num;
                }),
              ball: playArr[6],
              bonus: playArr[7],
              start: start,
              end: end,
              ticketCost: utils.dollarsToNum(ticketCost),
            };
          });
        Object.defineProperty(obj, sheet.getSheetName(), {
          value: playObjsArr,
        });

        return obj;
      }, {});
  }

  //******************************* Get Kitty Data *******************************

  /**
   * Returns kitty entries for the last date the kitty was updated.
   *
   * @returns {object} [[date,game name,debit,credit], ... ]
   */
  function getKittyLastArr() {
    "use strict";
    const kittyBalanceSheet =
      SpreadsheetApp.getActive().getSheetByName("Balance Sheet")!;
    const kittyBalanceArr = kittyBalanceSheet.getDataRange().getDisplayValues();
    const kittyLastDateStr = kittyBalanceArr.slice(-1)[0][0];
    const kittyLastDate = new Date(kittyLastDateStr);

    return kittyBalanceArr.filter(function (kittyRow) {
      const curDateStr = kittyRow[0];
      const curDate = new Date(curDateStr);

      return curDate.getTime() === kittyLastDate.getTime();
    });
  }

  //******************************************************************************

  /**
   * Compares entries in the kitty, for the last date the kitty was updated, with
   * drawings then returns drawings that have not yet posted to the kitty.
   *
   * @param {object} kittyLastArr [[date,game name,debit,credit] ... ]
   * @returns {object} {name: [{draw date,nums,jpt,ball,bonus,nxt dt,est jpt}],...}
   */
  function getNewDrawings(kittyLastArr: Array<Array<string>>) {
    "use strict";
    const lastKittyDate = new Date(kittyLastArr.slice(-1)[0][0]);
    const kittyGameNameArr = kittyLastArr.map(function (arr) {
      return arr[1];
    });
    return SpreadsheetApp.openById(
      PropertiesService.getScriptProperties().getProperties()
        .drawingSpreadsheetId,
    )
      .getSheets()
      .reduce(function (resultObj, drawingSheet) {
        const drawGameName = drawingSheet.getSheetName();
        const resData = drawingSheet
          .getDataRange()
          .getDisplayValues() // [[date,nums,jpt,ball,bonus,next date,est jpt] ... ]
          .slice(1)
          .filter(function (drawingArr) {
            const curDate = new Date(drawingArr[0]);
            // only want drawings not already logged in the kitty
            if (curDate.getTime() > lastKittyDate.getTime()) {
              return true;
            }
            return (
              curDate.getTime() === lastKittyDate.getTime() &&
              kittyGameNameArr.indexOf(drawGameName) < 0
            );
          })
          .map(function (drawArr) {
            const date = new Date(drawArr[0]);
            const nextDate = new Date(drawArr[5]);
            const drawingDataArr = {
              date: date,
              numArr: drawArr[1].split("-"),
              jackpot: drawArr[2],
              ball: drawArr[3],
              bonus: drawArr[4],
              nextDate: nextDate,
              estJackpot: drawArr[6],
            };

            return drawingDataArr;
          });
        Object.defineProperty(resultObj, drawGameName, { value: resData });

        return resultObj;
      }, {});
  }

  //******************************************************************************

  /**
   * Get drawings for games that have active plays and have jackpots that meet
   * the minimum threshold.
   * @param {object} newDrawingsObj
   * @param {object} playsObj
   * @param {object} gamesObj
   * @returns {object} {name:[{date,numArr,ball,bonus,jackpot,nextDate,
   *                           estJackpot},...],...}
   */
  function getActiveDraws(newDrawingsObj: {}, playsObj: {}, gamesObj: Game) {
    "use strict";
    return Object.keys(newDrawingsObj).reduce(function (obj, keyName) {
      // array contains drawings objects for one game
      const gameDraws = <Array<string>>(
        Object.getOwnPropertyDescriptor(newDrawingsObj, keyName)!
      );
      const activeDrawsArr = gameDraws
        .filter(
          // only return drawings that have active plays
          function (drawObj) {
            const resArr = <Array<string>>(
              Object.getOwnPropertyDescriptor(playsObj, keyName)
            );
            // true if a play is active for the drawing
            return resArr.some(function (playObj) {
              // drawing has active play
              return (
                playObj.start.getTime() <= drawObj.date.getTime() &&
                drawObj.date.getTime() <= playObj.end.getTime()
              );
            });
          },
        )
        .filter(
          // only return drawings whose jackpot meets minimum threshold
          function (drawObj) {
            const jackpot = 0;
            const threshold = 0;
            if (
              gamesObj[keyName].threshold === "" ||
              gamesObj[keyName].threshold === null ||
              gamesObj[keyName].threshold === undefined
            ) {
              return true;
            }
            jackpot = utils.dollarsToNum(drawObj.jackpot);
            threshold = utils.dollarsToNum(gamesObj[keyName].threshold);
            return jackpot >= threshold;
          },
        );
      if (activeDrawsArr.length > 0) {
        obj[keyName] = activeDrawsArr;
      }
      return obj;
    }, {});
  }

  //******************************************************************************

  /**
   * @param {object} activeDrawsObj - {name:[{date,numArr,ball,bonus,jackpot,
   *                                          nextDate,estJackpot},...],...}
   * @param {object} gamesObj - {name: {threshold, price, rules},...}
   * @param {object} playsObj - {name: [{numArr,ball,bonus,start,end},...]}
   * @returns {object} - [[date.getTime(),gameName,winnings,ticketCost],...]
   */
  function getWins(activeDrawsObj, gamesObj, playsObj) {
    "use strict";

    // return array [[date,gameName,winnings,...]
    return Object.keys(activeDrawsObj)
      .reduce(function (result, gameName) {
        const newVal = activeDrawsObj[gameName].map(function (drawObj) {
          const noOfPlays = 0; // number of active plays for one drawing
          const ticketCost = 0; // lump sum of a multi-play ticket
          const winnings = playsObj[gameName]
            .filter(function (playObj) {
              // active plays
              return (
                playObj.start.getTime() <= drawObj.date.getTime() &&
                drawObj.date.getTime() <= playObj.end.getTime()
              );
            })
            .reduce(function (total, activePlayObj, index) {
              const wins = 0;
              const matches = activePlayObj.numArr
                .reduce(function (total, playedNum) {
                  const matchTemp = drawObj.numArr.filter(function (drawnNum) {
                    return drawnNum === playedNum;
                  }).length;
                  return total + matchTemp;
                }, 0)
                .toString();
              const ball = "";
              const bonus = 1;
              const match = "";

              noOfPlays = index + 1; // number of plays for this drawing

              if (
                activePlayObj.ball !== "" &&
                activePlayObj.ball !== null &&
                activePlayObj.ball !== undefined
              ) {
                ball = activePlayObj.ball === drawObj.ball ? "1" : "0";
                match = matches + ball;
              } else {
                match = "0" + matches;
              }
              wins = gamesObj[gameName].rulesMap[match] || "$0";
              if (
                activePlayObj.bonus !== "" &&
                activePlayObj.bonus !== null &&
                activePlayObj.bonus !== undefined &&
                wins !== "jackpot"
              ) {
                if (activePlayObj.bonus === drawObj.bonus) {
                  bonus = activePlayObj.bonus;
                }
              }
              if (wins === "jackpot") {
                wins = utils.dollarsToNum(drawObj.jackpot);
              } else {
                wins = utils.dollarsToNum(wins);
              }

              // determine if it's a pay by draw or a multi-draw ticket
              if (
                activePlayObj.ticketCost !== null &&
                activePlayObj.ticketCost !== undefined &&
                activePlayObj.ticketCost !== "" &&
                activePlayObj.ticketCost > 0
              ) {
                if (activePlayObj.start.getTime() === drawObj.date.getTime()) {
                  ticketCost = activePlayObj.ticketCost + ticketCost;
                } else {
                  ticketCost = 0;
                }
              } else {
                ticketCost = undefined;
              }

              // total
              return total + wins * bonus;
            }, 0);
          return [
            drawObj.date.getTime(),
            gameName,
            winnings,
            noOfPlays,
            ticketCost,
          ];
        });

        // return array [[date.getTime(),gameName,winnings],...]
        return result.concat(newVal);
      }, [])
      .sort();
  }

  //******************************************************************************

  /**
   * @param {object} wins - [[date.getTime(),gameName,winnings,#of plays],...]
   * @param {object} gamesObj - {name: {threshold, price, rules},...}
   */
  function updateKitty(wins, gamesObj) {
    "use strict";
    const kittySsObj = SpreadsheetApp.getActive();
    wins.forEach(function (win) {
      const date = {};
      const dateStr = "";
      const gameName = "";
      const month = 0;
      const numOfPlays = 0;
      const rowContents = [];
      const ticketCost = 0;
      const winnings = 0;

      date = new Date(win[0]);
      gameName = win[1];
      winnings = win[2];
      numOfPlays = win[3];
      ticketCost = win[4];
      month = date.getMonth() + 1;
      dateStr =
        month.toString() + "/" + date.getDate() + "/" + date.getFullYear();
      if (ticketCost === undefined) {
        ticketCost = utils.dollarsToNum(gamesObj[gameName].price) * numOfPlays;
      }
      rowContents = [
        dateStr,
        gameName,
        utils.dollarsToNum(winnings),
        ticketCost,
      ];

      if (DEBUG === true) {
        Logger.log("updateKitty: %s", rowContents);
        //        debugger;
        return;
      }
      kittySsObj.getSheetByName("Balance Sheet").appendRow(rowContents);
    });
  }

  //******************************************************************************

  /** Sunk Cost Kitty - calculates, stores, and sends results. */
  function main() {
    "use strict";

    // 1. Get last row of kitty data.
    const kittyLastArr = getKittyLastArr(); // [[dt,name,deb,cred]...]

    // 2. Check for new results from last kitty update up to the latest draw date.
    //    Input: [[dt,name,deb,cred]...]
    //    Output: {name:[{date,numArr,jackpot,ball,bonus,nextDate,estJackpot},...
    //                  ],...
    //            }
    const newDrawingsObj = getNewDrawings(kittyLastArr);

    // 3. check for wins, send emails (alerts, wins)
    const gamesObj = getGames(); // {name: {threshold, price, rules},...}
    const playsObj = getPlays(); // {name: [{numArr,ball,bonus,start,
    //          end,ticketCost},...]}

    // 3.1 update kitty

    // Output: {name:[{date,numArr,ball,bonus,jackpot,nextDate,
    //                 estJackpot},...],...}
    const activeDrawsObj = getActiveDraws(newDrawingsObj, playsObj, gamesObj);

    // Output: [[date.getTime(),gameName,winnings,#of plays,ticketCost],...]
    const wins = getWins(activeDrawsObj, gamesObj, playsObj);
    updateKitty(wins, gamesObj);

    // 3.2 send email for results and newly active games
    mail.send(wins, newDrawingsObj, gamesObj);
  }

  //******************************************************************************

  return { main };
})();
