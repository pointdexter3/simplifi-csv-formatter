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

// function readFilesInChildDirectory(
//   dirPath: string
// ): SimplifiTransactionsInterface[] {
//   const absolutePath = path.resolve(dirPath);

//   // Read all items in the directory
//   const file = readdirSync(absolutePath);
//   let simplifiTransactions: SimplifiTransactionsInterface[] = [];

//   file.forEach((item) => {
//     const filePath = path.join(absolutePath, item);
//     const stats = statSync(filePath);

//     if (
//       stats.isFile() &&
//       (filePath.split(".").pop()?.toLowerCase() === "qfx" ||
//         filePath.split(".").pop()?.toLowerCase() === "ofx")
//     ) {
//       const content = readFileSync(filePath, "utf-8");
//       const transactionsList = qfxExtractTransactions(content);

//       simplifiTransactions = [
//         ...simplifiTransactions,
//         ...transactionsList.map((transItem) => {
//           return {
//             Date: convertOfxDateTimeToIsoDate(transItem.DTPOSTED),
//             Payee: `${transItem.NAME} ${transItem.MEMO ?? ""}`.replace(
//               / +/g,
//               " "
//             ),
//             Amount: (+transItem.TRNAMT).toFixed(2),
//           };
//         }),
//       ];
//     }
//   });

//   if (!file.length) {
//     console.log("No .qfx files found in nested directory:  ", absolutePath);
//   }

//   return simplifiTransactions;
// }

function readTransactionsFromFile(
  childDirPath: string,
  childFile: string
): SimplifiTransactionsInterface[] {
  const childFilePath = path.join(childDirPath, childFile);
  const isFile = statSync(childFilePath).isFile();

  if (
    isFile &&
    (childFilePath.split(".").pop()?.toLowerCase() === "qfx" ||
      childFilePath.split(".").pop()?.toLowerCase() === "ofx")
  ) {
    const content = readFileSync(childFilePath, "utf-8");
    const transactionsList = qfxExtractTransactions(content);

    return [
      ...transactionsList.map((transItem) => {
        return {
          Date: convertOfxDateTimeToIsoDate(transItem.DTPOSTED),
          Payee: `${transItem.NAME} ${transItem.MEMO ?? ""}`.replace(
            / +/g,
            " "
          ),
          Amount: (+transItem.TRNAMT).toFixed(2),
        };
      }),
    ];
  }

  return [];
}

function readTransactionsFromDirectory(
  filePath: string
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
      childDirPath
    );
  }

  return childSimplifiTransactions;
}

function readFilesInDirectory(dirPath: string): void {
  const absolutePath = path.resolve(dirPath);

  // Read all items in the directory
  const fileNameList = readdirSync(absolutePath);

  fileNameList.forEach((fileName) => {
    const filePath = path.join(absolutePath, fileName);
    const isDirectory = statSync(filePath).isDirectory();

    let simplifiTransactions: SimplifiTransactionsInterface[] | undefined;

    // Read all transactions from file or combined directory
    simplifiTransactions = isDirectory
      ? readTransactionsFromDirectory(filePath)
      : readTransactionsFromFile(absolutePath, fileName);

    if (simplifiTransactions.length) {
      simplifiTransactions.sort(sortTransactionsByIsoDateFn);

      simplifiTransactions = simplifiTransactions.map((transItem) => {
        return {
          ...transItem,
          Date: convertIsoDateToSimplifiDate(transItem.Date),
        };
      });

      writeTransactionsToCsv(simplifiTransactions, filePath);
    }
  });

  if (!fileNameList.length) {
    console.log("No .qfx files found in:  ", absolutePath);
  }
}

// remove characters that may interfer with parsing or importing into Simplifi
function ofxReduceNoise(contents: string) {
  return contents
    .replace(/^\s+|\s+$/gm, "") // remove leading whitespace
    .replace(/\$/g, "") // Remove dollar signs
    .replace(/\~/g, "") // Remove tilda
    .replace(/#/g, "") // Remove hash signs
    .replace(/\*/g, " ") // Remove asterisks signs
    .replace(/\'/g, "") // Remove single quotes '
    .replace(/\[[A-Za-z]{2}\]/g, "") // Remove 2 characters inside brackets [AB]
    .replace(/B\/M/g, "") // Remove "B/M"
    .replace(/ +/g, " "); // 2+ spaces reduced to 1
}

function qfxExtractTransactions(
  contents: string
): OfxTransactionItemInterface[] {
  const transactionTagRegex = /<\/?(BANKTRANLIST)>/;
  let transactionsTagContents = contents.split(transactionTagRegex)[2];

  transactionsTagContents = ofxReduceNoise(transactionsTagContents);

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
  filePath: string
): void {
  const fileNameWithoutExt = path
    .basename(filePath)
    .replace(/\.qfx|.QFX|.ofx|.OFX$/, "");
  const directory = path.dirname(filePath);

  const csvContent = simplifiTransactions.reduce(
    (accumulator, currentValue) => {
      return (
        accumulator +
        `"${currentValue.Date}","${currentValue.Payee}","${currentValue.Amount}",""\n`
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

function sortTransactionsByIsoDateFn(
  a: SimplifiTransactionsInterface,
  b: SimplifiTransactionsInterface
): number {
  if (a.Date === b.Date) {
    return 0;
  } else {
    return a.Date < b.Date ? -1 : 1;
  }
}

function convertOfxDateTimeToIsoDate(ofxDate: string): string {
  return dayjs(`${ofxDate}`.slice(0, 8), "YYYYMMDD").format("YYYY-MM-DD");
}

function convertIsoDateToSimplifiDate(isoDate: string): string {
  return dayjs(isoDate, "YYYY-MM-DD").format("MM/DD/YYYY");
}

function main(): void {
  const filterStart = process.argv.slice(2, 3);
  const filterEnd = process.argv.slice(3, 4);

  if (!!filterStart.length || !!filterEnd.length) {
    console.log(
      "DATE FILTERS: ",
      "\nstart: " + filterStart,
      "\nend: " + filterEnd + "\n"
    );
  }

  // const rawFileDirectoryPath = "./original_ofx_files";

  const rawFileDirectoryPath = "./csv-raw";
  readFilesInDirectory(rawFileDirectoryPath);
}

main();
