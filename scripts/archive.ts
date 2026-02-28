import { readdirSync, mkdirSync, existsSync, renameSync, cpSync, rmSync } from "node:fs";
import path from "node:path";
import dayjs from "dayjs";
import { validateRelativePath } from "./validation.js";

console.log("Archive script - creating new archive folder...");

export function getNewestArchiveFolder(basePath: string = "./"): string | null {
  validateRelativePath(basePath);
  const archivePath = path.resolve(basePath, "archive");
  
  if (!existsSync(archivePath)) {
    console.log("Archive directory does not exist, creating it...");
    mkdirSync(archivePath);
    return null;
  }

  const folders = readdirSync(archivePath).filter((folder) => {
    // Match YYYY-MM-DD_to_YYYY-MM-DD pattern
    return /^\d{4}-\d{2}-\d{2}_to_\d{4}-\d{2}-\d{2}$/.test(folder);
  });

  if (folders.length === 0) {
    console.log("No existing archive folders found");
    return null;
  }

  // Sort folders to get the newest (last alphabetically due to date format)
  folders.sort((a, b) => a.localeCompare(b));
  return folders.at(-1) ?? null;
}

export function extractToDate(folderName: string): string {
  // Extract the date after "_to_"
  const regex = /_to_(\d{4}-\d{2}-\d{2})$/;
  const match = regex.exec(folderName);
  return match ? match[1] : "";
}

export function createNewArchiveFolder(basePath: string = "./"): string {
  validateRelativePath(basePath);
  const newestFolder = getNewestArchiveFolder(basePath);
  
  let fromDate: string;
  
  if (newestFolder) {
    fromDate = extractToDate(newestFolder);
    console.log(`Previous archive folder: ${newestFolder}`);
    console.log(`Using previous to-date as from-date: ${fromDate}`);
  } else {
    // If no previous folder exists, use a default old date or prompt
    fromDate = "2000-01-01";
    console.log(`No previous archive found, using default from-date: ${fromDate}`);
  }
  
  const currentDate = dayjs().format("YYYY-MM-DD");
  console.log(`Current date (to-date): ${currentDate}`);
  
  const newFolderName = `${fromDate}_to_${currentDate}`;
  const newFolderPath = path.resolve(basePath, "archive", newFolderName);
  
  if (existsSync(newFolderPath)) {
    console.log(`Folder already exists: ${newFolderName}`);
    return newFolderPath;
  }
  
  mkdirSync(newFolderPath);
  
  if (!existsSync(newFolderPath)) {
    throw new Error(`Failed to create archive folder: ${newFolderName}`);
  }
  
  console.log(`Created new archive folder: ${newFolderName}`);
  return newFolderPath;
}

export function moveFoldersToArchive(archiveFolderPath: string, basePath: string = "./"): void {
  validateRelativePath(basePath);
  console.log("\nMoving folders to archive...");
  
  const foldersToArchive = [
    "original_ofx_files",
    "generated_simplifi_csv_files"
  ];
  
  foldersToArchive.forEach((folderName) => {
    const sourcePath = path.resolve(basePath, folderName);
    const destinationPath = path.join(archiveFolderPath, folderName);
    
    if (!existsSync(sourcePath)) {
      throw new Error(`Source folder does not exist: ${folderName}`);
    }
    
    renameSync(sourcePath, destinationPath);
    console.log(`Moved ${folderName} to archive`);
  });
  
  console.log("\nMove to archive complete!");
}

export function createPreviousGeneratedFolder(archiveFolderPath: string, basePath: string = "./"): void {
  validateRelativePath(basePath);
  console.log("\nCreating previous_generated_simplifi_csv_files folder...");
  
  const archivedCsvPath = path.join(archiveFolderPath, "generated_simplifi_csv_files");
  const previousCsvPath = path.resolve(basePath, "previous_generated_simplifi_csv_files");
  
  if (!existsSync(archivedCsvPath)) {
    throw new Error(`Archived CSV folder does not exist: ${archivedCsvPath}`);
  }
  
  if (existsSync(previousCsvPath)) {
    throw new Error(`previous_generated_simplifi_csv_files folder already exists`);
  }
  
  cpSync(archivedCsvPath, previousCsvPath, { recursive: true });
  console.log(`Copied generated_simplifi_csv_files to previous_generated_simplifi_csv_files`);
  console.log("\nArchive process complete!");
}

export function deletePreviousGeneratedFolder(basePath: string = "./"): void {
  validateRelativePath(basePath);
  console.log("\nDeleting existing previous_generated_simplifi_csv_files folder...");
  
  const previousCsvPath = path.resolve(basePath, "previous_generated_simplifi_csv_files");
  
  if (existsSync(previousCsvPath)) {
    rmSync(previousCsvPath, { recursive: true, force: true });
    console.log(`Deleted previous_generated_simplifi_csv_files folder`);
  } else {
    console.log(`No previous_generated_simplifi_csv_files folder to delete`);
  }
}



function main(): void {
  try {
    const basePath = "./";
    const newArchivePath = createNewArchiveFolder(basePath);
    moveFoldersToArchive(newArchivePath, basePath);
    deletePreviousGeneratedFolder(basePath);
    createPreviousGeneratedFolder(newArchivePath, basePath);
  } catch (error) {
    console.error(`\nArchive process failed: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

// Only run main() if this file is executed directly (not imported as a module)
// This allows the script to be imported in tests without executing main()
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
