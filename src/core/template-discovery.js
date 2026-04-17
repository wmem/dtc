import { expandGlob } from "../runtime/glob.js";
import { toComparablePath } from "../runtime/path.js";

export function discoverTemplates(configDir, filePatterns) {
  const files = [];
  const seen = new Set();

  for (const pattern of filePatterns) {
    const expanded = expandGlob(configDir, pattern);
    for (const file of expanded) {
      const comparable = toComparablePath(file);
      if (seen.has(comparable)) {
        continue;
      }
      seen.add(comparable);
      files.push(file);
    }
  }

  return files;
}
