interface DrawingData {
  date: Date;
  numArr: Array<number>;
  jackpot: string;
  ball: string;
  bonus: string;
  nextDate: Date;
  estJackpot: string;
}
interface GameDrawings {
  gameName: string;
  drawData: Array<DrawingData>;
}
interface Game {
  threshold: number;
  price: number;
  rules: Array<string>;
}
interface Kitty {
  date: Date;
  gameName: string;
  debit: number;
  credit: number;
}
interface Play {
  numArr: Array<number>;
  ball: string;
  bonus: string;
  start: Date;
  end: Date;
  ticketCost: number;
}
interface Plays {
  gameName: string;
  gamePlay: Array<Play>;
}
interface KittyScriptProperties {
  GAME_RULES_SPREADSHEET_ID: string;
  GAME_PLAYS_SPREADSHEET_ID: string;
  DRAWINGS_SPREADSHEET_ID: string;
  KITTY_SPREADSHEET_ID: string;
  LOTTERY_WEB_URL: string;
}
interface GameRules {
  game_id: string;
  game_name: string;
  ball: string;
  bonus: string;
  threshold?: number;
  price: number;
  matches: Array<{ match: string; rule: number | string }>;
}
