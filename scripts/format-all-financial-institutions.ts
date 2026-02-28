import { XMLParser } from "fast-xml-parser";
import {
  readFileSync,
  statSync,
  readdirSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import path from "node:path";
import dayjs from "dayjs";
import {
  OfxTransactionInterface,
  OfxTransactionItemInterface,
  SimplifiTransactionsInterface,
} from "./ofx.consts.js";

console.log(
  "-------------------------------------------------------------------------------\n" +
    "------------------------ Simplifi CSV Formatter - OFX/QFX -------------------------------\n" +
    "-------------------------------------------------------------------------------",
);

function readTransactionsFromFile(
  childDirPath: string,
  childFile: string,
): SimplifiTransactionsInterface[] {
  const childFilePath = path.join(childDirPath, childFile);
  const isFile = statSync(childFilePath).isFile();

  if (
    isFile &&
    (childFilePath.split(".").pop()?.toLowerCase() === "qfx" ||
      childFilePath.split(".").pop()?.toLowerCase() === "ofx")
  ) {
    const content = readFileSync(childFilePath, "utf-8");
    const transactionsList = content ? ofxExtractTransactions(content) : [];

    return transactionsList.map((transItem) => {
      // unfuck scotiabank OFX amount inconsistency
      const transItemAmount = invertTransactionDebitCredit(
        +transItem.TRNAMT,
        childFile,
      );

      return {
        Date: convertOfxDateTimeToIsoDate(transItem.DTPOSTED),
        Payee: `${transItem.NAME ? transItem.NAME + " " : ""}${
          transItem.MEMO ?? ""
        }`.replaceAll(/ +/g, " "),
        Amount: transItemAmount.toFixed(2),
      };
    });
  }

  return [];
}

/*
  FI's have DEBIT transactions as negative and CREDIT transactions as positive.

  AT ONE POINT SCOTIABANK HAD A BUG WHERE CREDIT/DEBIT TRANSACTIONS WERE INVERTED
  
  IF THIS HAPPENS WITH YOUR FI UPDATE THE financialInstitutionExceptions ARRAY below 
    WITH A UNIQUE IDENTIFIER STRING FROM THE FILE NAME OF THE OFX FILES DOWNLOADED.
*/
export function invertTransactionDebitCredit(
  transactionAmount: number,
  determineExceptionBasedOnFileName: string,
): number {
  // if the filename contains the following, invert the amount (debit becomes credit and credit becomes debit)
  // const financialInstitutionExceptions = ["SCOTIA"];
  const financialInstitutionExceptions: string[] = []; //
  const fileNameUpper = determineExceptionBasedOnFileName.toUpperCase();

  if (
    // eslint-disable-next-line sonarjs/no-empty-collection
    financialInstitutionExceptions.some((exception) =>
      fileNameUpper.includes(exception),
    )
  ) {
    return transactionAmount * -1;
  } else {
    return transactionAmount;
  }
}

function readTransactionsFromDirectory(
  filePath: string,
): SimplifiTransactionsInterface[] {
  const childDirPath = filePath;

  const childFileNameList = readdirSync(childDirPath);
  let childSimplifiTransactions: SimplifiTransactionsInterface[] = [];

  childFileNameList.forEach((childFileName) => {
    childSimplifiTransactions = [
      ...childSimplifiTransactions,
      ...readTransactionsFromFile(childDirPath, childFileName),
    ];
  });

  if (!childFileNameList.length || childSimplifiTransactions.length === 0) {
    console.log(
      "OFX files are empty or do not exist in nested directory:  ",
      childDirPath,
    );
  }

  return childSimplifiTransactions;
}

function parseOfxAndExportToSimplifyCsv(dirPath: string): void {
  const absolutePath = path.resolve(dirPath);
  const fileNameList = readdirSync(absolutePath);

  // Read all files/folders in the directory
  fileNameList.forEach((fileName) => {
    if (fileName === ".DS_Store") {
      return; // Ignore .DS_Store files
    }

    console.log("reading: " + fileName);
    const filePath = path.join(absolutePath, fileName);
    const isDirectory = statSync(filePath).isDirectory();

    let simplifiTransactions: SimplifiTransactionsInterface[] | undefined;

    // Read all transactions from file or combined directory
    simplifiTransactions = isDirectory
      ? readTransactionsFromDirectory(filePath)
      : readTransactionsFromFile(absolutePath, fileName);

    simplifiTransactions = simplifiTransactions.filter(
      (transaction, index, array) =>
        filterTranscationsByDateFn(transaction, index, array),
    );
    simplifiTransactions.sort((a, b) => sortTransactionsByIsoDateFn(a, b));
    simplifiTransactions = simplifiTransactions.map((transItem) => {
      return {
        ...transItem,
        Date: convertIsoDateToSimplifiDate(transItem.Date),
      };
    });

    writeTransactionsToCsv(simplifiTransactions, filePath);
  });

  if (!fileNameList.length) {
    console.log("No .OFX files found in:  ", absolutePath);
  }
}

// remove characters that may interfer with parsing or importing into Simplifi
export function ofxReduceNoise(contents: string) {
  return contents
    .replaceAll("$", "") // Remove dollar signs
    .replaceAll("~", "") // Remove tilda
    .replaceAll("#", "") // Remove hash signs
    .replaceAll("*", " ") // Remove asterisks signs
    .replaceAll("'", "") // Remove single quotes '
    .replaceAll("[", " ") // Remove opening square bracket, replace with space
    .replaceAll("]", " ") // Remove closing square bracket, replace with space
    .replaceAll("B/M", "") // Remove "B/M"
    .replaceAll(/ +/g, " ") // 2+ spaces reduced to 1
    .replaceAll(/(?:^\s+|\s+$)/gm, ""); // remove leading and trailing whitespace from each line
}

export function ofxExtractTransactions(
  contents: string,
): OfxTransactionItemInterface[] {
  const transactionTagRegex = /<\/?(BANKTRANLIST)>/;
  let transactionsTagContents = contents.split(transactionTagRegex)[2];

  transactionsTagContents = ofxReduceNoise(transactionsTagContents);

  // remove <DTSTART>value and <DTEND>value without closing tags (messes up parser)
  transactionsTagContents = transactionsTagContents.replace(
    /.*?(<STMTTRN>.*)/s,
    "$1",
  );

  // split tag pairs using new line
  const contentsXmlFormatMinusClosingTag = transactionsTagContents.replaceAll(
    "<",
    "\n<",
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
    "<BANKTRANLIST>" + contentsXmlFormat + "</BANKTRANLIST>", // add root tag
  ) as OfxTransactionInterface;

  // parser returns a single object rather than an array if there is only one transaction
  return Array.isArray(jsonData.BANKTRANLIST.STMTTRN)
    ? jsonData.BANKTRANLIST.STMTTRN
    : [jsonData.BANKTRANLIST.STMTTRN];
}

function writeTransactionsToCsv(
  simplifiTransactions: SimplifiTransactionsInterface[],
  filePath: string,
): void {
  const fileNameWithoutExt = path
    .basename(filePath)
    .replace(/\.(?:qfx|ofx)$/i, "");
  const directory = path.dirname(filePath);

  const csvContent = simplifiTransactions.reduce(
    (accumulator, currentValue) => {
      return (
        accumulator +
        `"${currentValue.Date}","${currentValue.Payee}","${currentValue.Amount}",""\n`
      );
    },
    `"Date","Payee","Amount","Tags"\n`, // SIMPLIFI CSV HEADER
  );

  const generatedOutputDirectory =
    directory + "/../generated_simplifi_csv_files/";
  if (!existsSync(generatedOutputDirectory)) {
    mkdirSync(generatedOutputDirectory);
  }

  writeFileSync(
    generatedOutputDirectory +
      fileNameWithoutExt +
      (simplifiTransactions.length ? "" : "-EMPTY") +
      ".csv",
    csvContent,
  );
  console.log("generated: " + fileNameWithoutExt + ".csv");
}

function sortTransactionsByIsoDateFn(
  a: SimplifiTransactionsInterface,
  b: SimplifiTransactionsInterface,
): number {
  if (a.Date === b.Date) {
    return 0;
  } else {
    return a.Date < b.Date ? -1 : 1;
  }
}

// date range is inclusive
function filterTranscationsByDateFn(
  transactionItem: SimplifiTransactionsInterface,
  _index: number,
  _array: SimplifiTransactionsInterface[],
): transactionItem is SimplifiTransactionsInterface {
  if (filterStartDateGlobal && transactionItem.Date < filterStartDateGlobal) {
    return false;
  }

  if (filterEndDateGlobal && transactionItem.Date > filterEndDateGlobal) {
    return false;
  }

  return true;
}

export function convertOfxDateTimeToIsoDate(ofxDate: string): string {
  return dayjs(`${ofxDate}`.slice(0, 8), "YYYYMMDD").format("YYYY-MM-DD");
}

export function convertIsoDateToSimplifiDate(isoDate: string): string {
  return dayjs(isoDate, "YYYY-MM-DD").format("MM/DD/YYYY");
}

function dateParamReturnDateOrUndefined(filterDate: string) {
  if (dayjs(filterDate, "YYYY-MM-DD").isValid() === false) {
    if (filterDate !== "date_default") {
      console.log(
        "Date provided invalid. Using default instead: " + filterDate,
      );
    }
    return undefined;
  } else {
    return filterDate;
  }
}

function setGlobalFilterDates(): void {
  const filterStart = process.argv.slice(2, 3)[0];
  const filterEnd = process.argv.slice(3, 4)[0];
  filterStartDateGlobal = dateParamReturnDateOrUndefined(filterStart);
  filterEndDateGlobal = dateParamReturnDateOrUndefined(filterEnd);
}

function printFilterRange() {
  console.log(
    `Outputing transations for filter range: ${
      filterStartDateGlobal ?? "OLDEST AVAILABLE"
    } ⸺ ${filterEndDateGlobal ?? "NEWEST AVAILABLE"}\n`,
  );
}

let filterStartDateGlobal: string | undefined;
let filterEndDateGlobal: string | undefined;

function main(): void {
  setGlobalFilterDates();
  printFilterRange();
  const rawFileDirectoryPath = "./original_ofx_files";
  parseOfxAndExportToSimplifyCsv(rawFileDirectoryPath);
}

// Only run main() if this file is executed directly (not imported as a module)
// This allows the script to be imported in tests without executing main()
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
