// 文件说明：
// 在 QuickJS 环境下实现受限 glob 展开，用于模板文件搜索。
import { hasWildcards, matchPath } from "../lib/pattern.js";
import { isDirectory, pathExists, walkDirectory } from "./fs.js";
import {
  getPathRoot,
  joinPath,
  normalizePath,
  resolvePath,
  splitSegments,
} from "./path.js";

// 把绝对 glob 模式拆成“固定搜索根目录 + 相对匹配模式”。
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

// 在 baseDir 下展开一个 glob 模式，返回稳定排序后的文件列表。
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
