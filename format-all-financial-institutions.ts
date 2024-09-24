import { XMLParser } from "fast-xml-parser";
import { readFileSync, statSync, readdirSync, writeFileSync } from "fs";
import path from "path";
import dayjs from "dayjs";
import {
  OfxAccountTypeEnum,
  OfxCreditAccountTag,
  OfxDebitAccountTag,
  OfxSchema,
  OfxTransactionInterface,
  simplifiTransactionsInterface,
} from "./ofx.consts.js";

console.log(
  "-------------------------------------------------------------------------------\n" +
    "------------------------ Simplifi CSV Formatter - QFX -------------------------------\n" +
    "-------------------------------------------------------------------------------"
);

function readFilesInDirectory(dirPath: string): void {
  const absolutePath = path.resolve(dirPath);

  // Read all items in the directory
  const items = readdirSync(absolutePath);

  items.forEach((item) => {
    const itemPath = path.join(absolutePath, item);
    const stats = statSync(itemPath);

    if (stats.isDirectory()) {
      // If it's a directory, recursively read files in that directory
      // readFilesInDirectory(itemPath); // uncomment if nested directory support should be added
    } else if (stats.isFile() && itemPath.split(".").pop() === "qfx") {
      processFile(itemPath);
    }
  });
}

function qfxToXmlConverterPreMassage(
  contents: string,
  ofxAccountType: OfxAccountTypeEnum
): string {
  // ofxAccountType
  return contents;
}

function qfxToXmlConverter(contents: string): string {
  // remove OFX header meta data
  contents = "<OFX>" + contents.split("<OFX>")[1];

  const regexOpeningTag = /</g;


  let xmlContents = contents
    // add a new line every opening tag (for files which don't have new lines)
    .replaceAll("<", "\n<")
    // remove duplicate new lines (if newlines aleady existed)
    .replaceAll("\n\n", "\n")
    ;

  console.log("xmlContents: ", xmlContents);

  const regexFindTagAndValueWithMissingClosingTag = /^<(.*)>(.+)$/;
  const lines = xmlContents.split("\n");

  xmlContents = lines
    .map((line) => {
      // console.log("randy line: ", line);
      const match = regexFindTagAndValueWithMissingClosingTag.exec(line);
      if (match) {
        const key = match[1].trim(); // The key (the entire tag)
        const value = match[2].trim(); // The value after the key
        return `<${key}>${value}</${key}>`;
      } else {
        return line;
      }
    })
    .join("");

  return xmlContents;
}

function processFile(filePath: string): void {
  const fileNameWithoutExt = path.basename(filePath, ".qfx");
  const directory = path.dirname(filePath);

  // console.log("fileNameWithoutExt: " + fileNameWithoutExt);
  // console.log("directory: " + directory);
  let content = readFileSync(filePath, "utf-8");

  const ofxAccountType = extractAccountType(content);
  content = qfxToXmlConverterPreMassage(content, ofxAccountType);

  console.log(content)


  content = qfxToXmlConverter(content);

  console.log(content)


  const parser = new XMLParser();
  const jsonData = parser.parse(content) as OfxSchema;

  console.log(jsonData)

  const transactionsList = extractOfxTransactions(jsonData, ofxAccountType);

  const simplifiTransactions = transactionsList.map((transItem) => {
    return {
      Date: convertOfxDateTimeToSimplifiDate(transItem.DTPOSTED),
      Payee: transItem.NAME,
      Amount: transItem.TRNAMT,
    };
  });
  // console.log(JSON.stringify(simplifiTransactions));
  writeTransactionsToCsv(simplifiTransactions, directory, fileNameWithoutExt);
}

function extractOfxTransactions(
  ofxJsonData: OfxSchema,
  ofxAccountType: OfxAccountTypeEnum
): OfxTransactionInterface[] {
  if (ofxAccountType === OfxAccountTypeEnum.DEBIT) {
    console.log("meadow: ", ofxJsonData.OFX)
    return ofxJsonData.OFX[OfxDebitAccountTag].STMTTRNRS.STMTRS.BANKTRANLIST
      .STMTTRN;
  } else if (ofxAccountType === OfxAccountTypeEnum.CREDIT) {
    return ofxJsonData.OFX[OfxCreditAccountTag].CCSTMTTRNRS.CCSTMTRS
      .BANKTRANLIST.STMTTRN;
  } else {
    
  }

  return [];
  // const transactionsList =
  // jsonData.OFX.CREDITCARDMSGSRSV1.CCSTMTTRNRS.CCSTMTRS.BANKTRANLIST.STMTTRN;

  // jsonData.OFX.BANKMSGSRSV1.STMTTRNRS.
}

function extractAccountType(ofxContent: string): OfxAccountTypeEnum {
  if (ofxContent.includes(OfxCreditAccountTag)) {
    return OfxAccountTypeEnum.CREDIT;
  }

  if (ofxContent.includes(OfxDebitAccountTag)) {
    return OfxAccountTypeEnum.DEBIT;
  }

  throw "extractAccountType unknown tag";
}

function writeTransactionsToCsv(
  simplifiTransactions: simplifiTransactionsInterface[],
  directory: string,
  fileNameWithoutExt: string
): void {
  simplifiTransactions.sort(sortTransactionsByDateFn);

  const csvContent = simplifiTransactions.reduce(
    (accumulator, currentValue) => {
      return (
        accumulator +
        `"${currentValue.Date}","${currentValue.Payee}","${currentValue.Amount}"\n`
      );
    },
    `"Date","Payee","Amount","Tags"\n` // SIMPLIFI CSV HEADER
  );
  writeFileSync(directory + "/" + fileNameWithoutExt + ".csv", csvContent);
  console.log("generated: " + fileNameWithoutExt + ".csv");
}

function sortTransactionsByDateFn(
  a: simplifiTransactionsInterface,
  b: simplifiTransactionsInterface
): number {
  return a.Date === b.Date ? 0 : a.Date < b.Date ? -1 : 1;
}

function convertOfxDateTimeToSimplifiDate(ofxDate: string): string {
  return dayjs(`${ofxDate}`.slice(0, 8), "YYYYMMDDHHMMSS").format("YYYY-MM-DD");
}

function main(): void {
  const rawFileDirectoryPath = "./raw-various-formats";
  readFilesInDirectory(rawFileDirectoryPath);
}

main();
