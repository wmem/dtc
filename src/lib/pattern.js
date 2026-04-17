function escapeRegex(text) {
  return text.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

export function hasWildcards(pattern) {
  return pattern.includes("*") || pattern.includes("?");
}

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

function matchPathSegments(pathSegments, patternSegments, pathIndex, patternIndex) {
  if (patternIndex === patternSegments.length) {
    return pathIndex === pathSegments.length;
  }

  const token = patternSegments[patternIndex];
  if (token === "**") {
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

export function matchPath(path, pattern) {
  const normalizedPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  const normalizedPattern = pattern.replace(/\\/g, "/").replace(/^\/+/, "");
  const pathSegments = normalizedPath.split("/").filter(Boolean);
  const patternSegments = normalizedPattern.split("/").filter(Boolean);
  return matchPathSegments(pathSegments, patternSegments, 0, 0);
}
