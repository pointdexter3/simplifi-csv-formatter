export type OfxDateType = "20240914195104.001[-5:EDT]"; //YYYYMMDDHHMMSS
export type OfxCurrencyType = "CAD" | "USD";
export type OfxTransactionType = "DEBIT" | "CREDIT";

export const OfxDebitAccountTag = "BANKMSGSRSV1";
export const OfxCreditAccountTag = "CREDITCARDMSGSRSV1";

export enum OfxAccountTypeEnum {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT",
}

export interface OfxTransactionInterface {
  TRNTYPE: OfxTransactionType;
  DTPOSTED: OfxDateType;
  TRNAMT: number; // 2-digit number
  FITID: number; // 7.7777777777e30
  NAME: string;
}

export interface OfxSchema {
  OFX: {
    SIGNONMSGSRSV1: {
      SONRS: {
        STATUS: { CODE: number; SEVERITY: "INFO"; MESSAGE: "OK" };
        DTSERVER: OfxDateType;
        USERKEY: "AABBFF12345";
        LANGUAGE: "ENG";
        "INTU.BID": number;
      };
    };
    [OfxDebitAccountTag]: {
      STMTTRNRS: {
        TRNUID: number;
        STATUS: { CODE: number; SEVERITY: "INFO"; MESSAGE: "OK" };
        STMTRS: {
          CURDEF: OfxCurrencyType;
          BANKACCTFROM: { ACCTID: number; BANKID: number; ACCTTYPE: string };
          BANKTRANLIST: {
            DTSTART: OfxDateType;
            DTEND: OfxDateType;
            STMTTRN: OfxTransactionInterface[];
          };
          LEDGERBAL: {
            BALAMT: number; // -777.7;
            DTASOF: OfxDateType;
          };
          AVAILBAL: {
            BALAMT: number; //-777.7;
            DTASOF: OfxDateType;
          };
        };
      };
    };
    [OfxCreditAccountTag]: {
      CCSTMTTRNRS: {
        TRNUID: number;
        STATUS: { CODE: number; SEVERITY: "INFO"; MESSAGE: "OK" };
        CCSTMTRS: {
          CURDEF: OfxCurrencyType;
          CCACCTFROM: { ACCTID: number };
          BANKTRANLIST: {
            DTSTART: OfxDateType;
            DTEND: OfxDateType;
            STMTTRN: OfxTransactionInterface[];
          };
          LEDGERBAL: {
            BALAMT: number; // -777.7;
            DTASOF: OfxDateType;
          };
          AVAILBAL: {
            BALAMT: number; //-777.7;
            DTASOF: OfxDateType;
          };
        };
      };
    };
  };
}

export interface simplifiTransactionsInterface {
  Date: string;
  Payee: string;
  Amount: number;
}
