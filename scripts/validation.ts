import path from "node:path";

/**
 * Validates that a basePath is:
 * 1. Relative (not absolute)
 * 2. Within a valid repository (csv-extractor or simplifi-csv-formatter)
 * 3. Doesn't escape the repository via directory traversal
 * 
 * @throws {Error} If validation fails
 */
export function validateRelativePath(basePath: string): void {
  if (path.isAbsolute(basePath)) {
    throw new Error(`basePath must be relative, received absolute path: ${basePath}`);
  }
  
  // Check that the resolved path stays within the repository
  const resolvedPath = path.resolve(basePath);
  const repoRoot = process.cwd();
  
  // Verify we're in a valid repo folder
  if (!repoRoot.includes('csv-extractor') && !repoRoot.includes('simplifi-csv-formatter')) {
    throw new Error(`Current directory is not within a valid repository (csv-extractor or simplifi-csv-formatter)`);
  }
  
  // Ensure the resolved path doesn't escape the repo
  if (!resolvedPath.startsWith(repoRoot)) {
    throw new Error(`basePath resolves outside the repository: ${resolvedPath}`);
  }
}
