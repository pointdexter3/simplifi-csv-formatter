import { cpSync, mkdirSync, existsSync } from "fs";
import path from "path";

console.log("Copy empty templates script - copying template files...");

function copyTemplateFiles(): void {
  const templatePath = path.resolve("./template/original_ofx_files");
  const destinationPath = path.resolve("./original_ofx_files");
  
  if (!existsSync(templatePath)) {
    throw new Error(`Template folder does not exist: ${templatePath}`);
  }
  
  if (existsSync(destinationPath)) {
    throw new Error(`Destination folder already exists: ${destinationPath}`);
  }
  
  mkdirSync(destinationPath);
  console.log(`Created folder: original_ofx_files`);
  
  cpSync(templatePath, destinationPath, { recursive: true });
  console.log(`Copied template files from template/original_ofx_files to original_ofx_files`);
  console.log("\nTemplate copy complete!");
}

function main(): void {
  try {
    copyTemplateFiles();
  } catch (error) {
    console.error(`\nTemplate copy failed: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main();
