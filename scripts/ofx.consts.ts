export type OfxDateType = "20240914195104.001[-5:EDT]"; //YYYYMMDDHHMMSS
export type OfxCurrencyType = "CAD" | "USD";
export type OfxTransactionType = "DEBIT" | "CREDIT";

export interface OfxTransactionInterface {
  BANKTRANLIST: {
    DTSTART: OfxDateType;
    DTEND: OfxDateType;
    STMTTRN: OfxTransactionItemInterface[];
  };
}

export interface OfxTransactionItemInterface {
  TRNTYPE: OfxTransactionType;
  DTPOSTED: OfxDateType;
  TRNAMT: number; // 2-digit number
  FITID: number; // 7.7777777777e30
  NAME?: string; // 32 character limit // OFX required but sometimes FI's omit and use MEMO
  MEMO?: string; // OFX optional, often used by FI to get around NAME character limit
}

export interface SimplifiTransactionsInterface {
  Date: string;
  Payee: string;
  Amount: string;
}
