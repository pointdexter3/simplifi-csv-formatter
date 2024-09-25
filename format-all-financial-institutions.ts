import { XMLParser } from "fast-xml-parser";
import { readFileSync, statSync, readdirSync, writeFileSync } from "fs";
import path from "path";
import dayjs from "dayjs";
import {
  OfxTransactionInterface,
  OfxTransactionItemInterface,
  SimplifiTransactionsInterface,
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

  if (!items.length) {
    console.log("No .qfx files found in:  ", absolutePath);
  }
}

function processFile(filePath: string): void {
  const fileNameWithoutExt = path.basename(filePath, ".qfx");
  const directory = path.dirname(filePath);

  // console.log("fileNameWithoutExt: " + fileNameWithoutExt);
  // console.log("directory: " + directory);

  const content = readFileSync(filePath, "utf-8");
  const transactionsList = qfxExtractTransactions(content);

  const simplifiTransactions = transactionsList.map((transItem) => {
    return {
      Date: convertOfxDateTimeToSimplifiDate(transItem.DTPOSTED),
      Payee: transItem.NAME,
      Amount: (+transItem.TRNAMT).toFixed(2),
    };
  });
  writeTransactionsToCsv(simplifiTransactions, directory, fileNameWithoutExt);
}

function qfxExtractTransactions(contents: string): OfxTransactionItemInterface[] {
  const transactionTagRegex = /<\/?(BANKTRANLIST)>/;
  let transactionsTagContents = contents.split(transactionTagRegex)[2];

  // remove <DTSTART>value and <DTEND>value without closing tags (messes up parser)
  transactionsTagContents = transactionsTagContents.replace(
    /.*?(<STMTTRN>.*)/s,
    "$1"
  );

  // split tag pairs using new line
  const contentsXmlFormatMinusClosingTag = transactionsTagContents.replaceAll(
    "<",
    "\n<"
  );
  // create array to iterate through tag pairs
  const lines = contentsXmlFormatMinusClosingTag.split("\n");

  // add closing tags to tag/value pairs
  const contentsXmlFormat = lines
    .map((line) => {
      const regexFindTagAndValueWithMissingClosingTag = /^<(.*)>(.+)$/;
      const match = regexFindTagAndValueWithMissingClosingTag.exec(line);
      if (match) {
        const tagName = match[1].trim();
        const value = match[2].trim();
        // add closing tag
        return `<${tagName}>${value}</${tagName}>`;
      } else {
        return line;
      }
    })
    .join("");

  const parser = new XMLParser();
  const jsonData = parser.parse(
    "<BANKTRANLIST>" + contentsXmlFormat + "</BANKTRANLIST>" // add root tag
  ) as OfxTransactionInterface;

  return jsonData.BANKTRANLIST.STMTTRN;
}

function writeTransactionsToCsv(
  simplifiTransactions: SimplifiTransactionsInterface[],
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
  writeFileSync(
    directory +
      "/../generated_simplifi_csv_files/" +
      fileNameWithoutExt +
      ".csv",
    csvContent
  );
  console.log("generated: " + fileNameWithoutExt + ".csv");
}

function sortTransactionsByDateFn(
  a: SimplifiTransactionsInterface,
  b: SimplifiTransactionsInterface
): number {
  if (a.Date === b.Date) {
    return 0;
  } else {
    return a.Date < b.Date ? -1 : 1;
  }
}

function convertOfxDateTimeToSimplifiDate(ofxDate: string): string {
  return dayjs(`${ofxDate}`.slice(0, 8), "YYYYMMDDHHMMSS").format("YYYY-MM-DD");
}

function main(): void {
  const rawFileDirectoryPath = "./original_ofx_files";
  readFilesInDirectory(rawFileDirectoryPath);
}

main();
