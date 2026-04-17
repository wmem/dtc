import { hasWildcards, matchPath } from "../lib/pattern.js";
import { isDirectory, pathExists, walkDirectory } from "./fs.js";
import {
  getPathRoot,
  joinPath,
  normalizePath,
  resolvePath,
  splitSegments,
} from "./path.js";

function getSearchPlan(absolutePattern) {
  const normalizedPattern = normalizePath(absolutePattern);
  const root = getPathRoot(normalizedPattern);
  const segments = splitSegments(normalizedPattern);
  const staticSegments = [];

  for (const segment of segments) {
    if (hasWildcards(segment)) {
      break;
    }
    staticSegments.push(segment);
  }

  let searchRoot = root || ".";
  if (staticSegments.length > 0) {
    searchRoot = joinPath(searchRoot, ...staticSegments);
  }

  const patternSegments = segments.slice(staticSegments.length);
  return {
    searchRoot: normalizePath(searchRoot),
    relativePattern: patternSegments.join("/"),
  };
}

export function expandGlob(baseDir, pattern) {
  const absolutePattern = resolvePath(baseDir, pattern);

  if (!hasWildcards(pattern)) {
    return pathExists(absolutePattern) ? [absolutePattern] : [];
  }

  const { searchRoot, relativePattern } = getSearchPlan(absolutePattern);
  if (!pathExists(searchRoot) || !isDirectory(searchRoot)) {
    return [];
  }

  const matches = [];
  walkDirectory(searchRoot, (childPath, isDir) => {
    if (isDir) {
      return;
    }

    const relativePath = childPath.slice(searchRoot.length).replace(/^\/+/, "");
    if (matchPath(relativePath, relativePattern)) {
      matches.push(normalizePath(childPath));
    }
  });

  matches.sort();
  return matches;
}
