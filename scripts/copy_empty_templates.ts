import { cpSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { validateRelativePath } from "./validation.js";

console.log("Copy empty templates script - copying template files...");

export function copyTemplateFiles(basePath: string = "./"): void {
  validateRelativePath(basePath);
  const templatePath = path.resolve(basePath, "template/original_ofx_files");
  const destinationPath = path.resolve(basePath, "original_ofx_files");
  
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

// Only run main() if this file is executed directly (not imported as a module)
// This allows the script to be imported in tests without executing main()
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
