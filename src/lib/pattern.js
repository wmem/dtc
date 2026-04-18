// 文件说明：
// 统一实现通配符匹配逻辑，供 glob 搜索和 match 规则复用。
// 转义正则元字符，避免普通字符被当成正则语义。
function escapeRegex(text) {
  return text.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

// 判断模式中是否包含通配符。
export function hasWildcards(pattern) {
  return pattern.includes("*") || pattern.includes("?");
}

// 在单一路径段范围内匹配 * 和 ? 通配符。
export function matchSegment(text, pattern) {
  let source = "^";

  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    if (char === "*") {
      source += ".*";
    } else if (char === "?") {
      source += ".";
    } else {
      source += escapeRegex(char);
    }
  }

  source += "$";
  return new RegExp(source).test(text);
}

// 递归匹配路径段，支持 ** 跨目录通配。
function matchPathSegments(pathSegments, patternSegments, pathIndex, patternIndex) {
  if (patternIndex === patternSegments.length) {
    return pathIndex === pathSegments.length;
  }

  const token = patternSegments[patternIndex];
  if (token === "**") {
    // ** 可以吞掉任意层级目录，因此需要尝试所有可能的切分点。
    if (patternIndex === patternSegments.length - 1) {
      return true;
    }

    for (let i = pathIndex; i <= pathSegments.length; i += 1) {
      if (matchPathSegments(pathSegments, patternSegments, i, patternIndex + 1)) {
        return true;
      }
    }
    return false;
  }

  if (pathIndex >= pathSegments.length) {
    return false;
  }

  if (!matchSegment(pathSegments[pathIndex], token)) {
    return false;
  }

  return matchPathSegments(pathSegments, patternSegments, pathIndex + 1, patternIndex + 1);
}

// 匹配完整路径，先统一分隔符再按路径段比较。
export function matchPath(path, pattern) {
  const normalizedPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  const normalizedPattern = pattern.replace(/\\/g, "/").replace(/^\/+/, "");
  const pathSegments = normalizedPath.split("/").filter(Boolean);
  const patternSegments = normalizedPattern.split("/").filter(Boolean);
  return matchPathSegments(pathSegments, patternSegments, 0, 0);
}
