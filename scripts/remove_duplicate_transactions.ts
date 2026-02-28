import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

console.log("Remove duplicate transactions script - removing overlapping transactions...");

export function getLastLine(filePath: string): string | null {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");
  
  if (lines.length <= 1) {
    return null;
  }
  
  return lines.at(-1) ?? null;
}

function removeDuplicateTransactions(fileName: string): void {
  const previousFilePath = path.resolve(`./simplifi_transaction_files/previous_generated_simplifi_csv_files/${fileName}`);
  const currentFilePath = path.resolve(`./simplifi_transaction_files/generated_simplifi_csv_files/${fileName}`);
  
  if (!existsSync(previousFilePath)) {
    console.log(`No previous file found for ${fileName}, skipping deduplication`);
    return;
  }
  
  if (!existsSync(currentFilePath)) {
    throw new Error(`Current file does not exist: ${fileName}`);
  }
  
  console.log(`Processing ${fileName}...`);
  
  const lastLineOfPrevious = getLastLine(previousFilePath);
  
  if (lastLineOfPrevious === null) {
    console.log(`  Previous file ${fileName} is empty (no data rows), skipping deduplication`);
    return;
  }
  
  const currentContent = readFileSync(currentFilePath, "utf-8");
  const currentLines = currentContent.trim().split("\n");
  
  if (currentLines.length <= 1) {
    console.log(`  ${fileName} has no data rows, skipping`);
    return;
  }
  
  // Find the index of the last line from previous file in current file
  const lastOccurrenceIndex = currentLines.lastIndexOf(lastLineOfPrevious);
  
  if (lastOccurrenceIndex === -1) {
    console.log(`  Last line from previous export not found in ${fileName}, no duplicates removed`);
    return;
  }
  
  if (lastOccurrenceIndex === 0) {
    throw new Error(`Last line from previous file matches the header in ${fileName}`);
  }
  
  // Keep header (line 0) and all lines after the last occurrence
  const header = currentLines[0];
  const newLines = currentLines.slice(lastOccurrenceIndex + 1);
  
  const removedCount = lastOccurrenceIndex;
  console.log(`  Removed ${removedCount} duplicate transaction(s) from ${fileName}`);
  console.log(`  Kept ${newLines.length} new transaction(s)`);
  
  const newContent = [header, ...newLines].join("\n") + "\n";
  writeFileSync(currentFilePath, newContent);
}

function processAllFiles(): void {
  const generatedCsvPath = path.resolve("./simplifi_transaction_files/generated_simplifi_csv_files");
  
  if (!existsSync(generatedCsvPath)) {
    throw new Error("generated_simplifi_csv_files folder does not exist");
  }
  
  const fileNames = readdirSync(generatedCsvPath).filter((fileName) => {
    return fileName.endsWith(".csv");
  });
  
  if (fileNames.length === 0) {
    console.log("No CSV files found in generated_simplifi_csv_files");
    return;
  }
  
  console.log(`Found ${fileNames.length} CSV file(s) to process\n`);
  
  fileNames.forEach((fileName) => {
    removeDuplicateTransactions(fileName);
  });
  
  console.log("\nDeduplication complete!");
}

function main(): void {
  try {
    processAllFiles();
  } catch (error) {
    console.error(`\nDeduplication failed: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

// Only run main() if this file is executed directly (not imported as a module)
// This allows the script to be imported in tests without executing main()
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
