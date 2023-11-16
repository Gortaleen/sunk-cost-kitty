function kittyUpdateRun() {
  Kitty.update();
}

/**
 * Kitty spreadsheet functions
 */
const Kitty = (function () {
  /**
   *
   */

  function getGameRules(
    scriptProperties: KittyScriptProperties,
  ): Array<GameRules> {
    /**
     * Returns an array of Game Rules objects
     */
    const gameRulesSpreadsheet = SpreadsheetApp.openById(
      scriptProperties.GAME_RULES_SPREADSHEET_ID,
    );

    return gameRulesSpreadsheet
      .getSheets()
      .map(function buildRulesObject(rulesSheet): GameRules {
        const rulesArr: Array<Array<string>> = rulesSheet
          .getDataRange()
          .getDisplayValues();
        let rulesObj: GameRules = {
          game_id: rulesArr[0][1],
          game_name: rulesArr[1][1],
          ball: rulesArr[2][1],
          bonus: rulesArr[3][1],
          threshold: Number(rulesArr[4][1].slice(1)),
          price: Number(rulesArr[5][1].slice),
          matches: rulesArr.slice(6).map((row) => {
            return { match: row[1], rule: Number(row[2]) };
          }),
        };

        return rulesObj;
      });
  }

  /**
   * Returns the date of the last entry in the Kitty Balance Sheet
   */
  function getKittyLastEdited(scriptProperties: KittyScriptProperties): Date {
    const balanceSheet = SpreadsheetApp.openById(
      scriptProperties.KITTY_SPREADSHEET_ID,
    ).getSheetByName("Balance Sheet");
    const lastRow = balanceSheet?.getLastRow();

    return lastRow && lastRow > 1
      ? balanceSheet?.getRange(lastRow, 1).getValue()
      : Date();
  }

  /**
   * Drawings since last Kitty spreadsheet update.
   */
  function getLatestDrawings(
    scriptProperties: KittyScriptProperties,
    kittyLastEdited: Date,
  ): Array<GameDrawings> {
    let drawsArr: Array<GameDrawings> = Object();

    drawsArr = SpreadsheetApp.openById(scriptProperties.DRAWINGS_SPREADSHEET_ID)
      .getSheets()
      .map(function (sheet): GameDrawings {
        let gameDrawings: GameDrawings = Object();

        gameDrawings = {
          gameName: sheet.getName(),
          drawData: sheet
            .getDataRange()
            .getValues()
            .slice(1)
            .filter((row) => row[0] > kittyLastEdited)
            .map(function (row): DrawingData {
              let drawingData: DrawingData = Object();

              drawingData.date = row[0];
              drawingData.numArr = row[1];
              drawingData.jackpot = row[2];
              drawingData.ball = row[3];
              drawingData.bonus = row[4];
              drawingData.nextDate = row[5];
              drawingData.estJackpot = row[6];

              return drawingData;
            }),
        };

        return gameDrawings;
      });

    return drawsArr;
  }

  /**
   *
   */
  function getActiveGamePlays(
    scriptProperties: KittyScriptProperties,
    kittyLastEdited: Date,
  ) {
    let activeGamePlays: Array<Plays> = Object();

    activeGamePlays = SpreadsheetApp.openById(
      scriptProperties.GAME_PLAYS_SPREADSHEET_ID,
    )
      .getSheets()
      .map(function (playSheet): Plays {
        let gamePlays: Plays = Object();

        gamePlays.gameName = playSheet.getName();
        gamePlays.gamePlay = playSheet
          .getDataRange()
          .getValues()
          .slice(1)
          .filter(
            (row) =>
              row[8] &&
              row[8] <= kittyLastEdited &&
              (!row[9] || row[9] >= kittyLastEdited),
          )
          .map(function (row) {
            let play: Play = Object();

            play.numArr = row.slice(0, 5).filter((val) => val);
            play.ball = row[6];
            play.bonus = row[7];
            play.start = row[8];
            play.end = row[9];
            play.ticketCost = row[10];

            return play;
          });

        return gamePlays;
      });

    return activeGamePlays;
  }

  /**
   *
   */
  function calcResultsUpdateKitty() {}

  /**
   * Main function
   */
  function update() {
    const scriptProperties = <KittyScriptProperties>(
      (<unknown>PropertiesService.getScriptProperties().getProperties())
    );

    // get Game rules
    const gameRules = getGameRules(scriptProperties);

    // get Kitty last edited date
    const kittyLastEdited = getKittyLastEdited(scriptProperties);

    // get Drawing results
    const latestDrawings = getLatestDrawings(scriptProperties, kittyLastEdited);

    // get active Game plays
    const activeGamePlays = getActiveGamePlays(
      scriptProperties,
      kittyLastEdited,
    );

    // calculate new results and update Kitty

    return;
  }

  return { update };
})();
