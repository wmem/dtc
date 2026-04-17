import { ensureParentDirectory, writeTextFile } from "../runtime/fs.js";

export function writeOutputFile(outputPath, content) {
  ensureParentDirectory(outputPath);
  writeTextFile(outputPath, content);
}
