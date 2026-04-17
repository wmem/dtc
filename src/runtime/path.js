const WINDOWS_DRIVE_RE = /^[a-zA-Z]:[\\/]/;
const WINDOWS_UNC_RE = /^\\\\[^\\]+\\[^\\]+/;

function toUnixSeparators(path) {
  return String(path).replace(/\\/g, "/");
}

function splitRoot(path) {
  const input = toUnixSeparators(path);

  if (WINDOWS_DRIVE_RE.test(path)) {
    const drive = input.slice(0, 2).toLowerCase();
    const rest = input.slice(2);
    return { root: `${drive}/`, rest };
  }

  if (WINDOWS_UNC_RE.test(path)) {
    const body = input.slice(2);
    const parts = body.split("/").filter(Boolean);
    if (parts.length < 2) {
      return { root: "//", rest: body };
    }
    const root = `//${parts[0]}/${parts[1]}/`;
    const rest = body.slice(`${parts[0]}/${parts[1]}`.length);
    return { root, rest };
  }

  if (input.startsWith("/")) {
    return { root: "/", rest: input.slice(1) };
  }

  return { root: "", rest: input };
}

export function getPathRoot(path) {
  return splitRoot(path).root;
}

export function isAbsolutePath(path) {
  const input = String(path);
  return input.startsWith("/") || WINDOWS_DRIVE_RE.test(input) || WINDOWS_UNC_RE.test(input);
}

export function normalizePath(path) {
  const { root, rest } = splitRoot(path);
  const segments = rest.split("/").filter((segment) => segment.length > 0);
  const normalized = [];

  for (const segment of segments) {
    if (segment === ".") {
      continue;
    }

    if (segment === "..") {
      if (normalized.length > 0 && normalized[normalized.length - 1] !== "..") {
        normalized.pop();
        continue;
      }

      if (!root) {
        normalized.push(segment);
      }
      continue;
    }

    normalized.push(segment);
  }

  const body = normalized.join("/");
  if (!root) {
    return body || ".";
  }

  if (!body) {
    return root === "//" ? "//" : root.replace(/\/$/, "") || "/";
  }

  return `${root}${body}`.replace(/\/{2,}/g, (match, offset, full) => {
    if (offset === 0 && full.startsWith("//")) {
      return "//";
    }
    return "/";
  });
}

export function joinPath(...parts) {
  const filtered = parts.filter((part) => part !== undefined && part !== null && part !== "");
  if (filtered.length === 0) {
    return ".";
  }

  let result = String(filtered[0]);
  for (let i = 1; i < filtered.length; i += 1) {
    const next = String(filtered[i]);
    if (isAbsolutePath(next)) {
      result = next;
      continue;
    }
    if (!result.endsWith("/") && !result.endsWith("\\")) {
      result += "/";
    }
    result += next;
  }
  return normalizePath(result);
}

export function resolvePath(basePath, targetPath) {
  if (!targetPath) {
    return normalizePath(basePath);
  }

  if (isAbsolutePath(targetPath)) {
    return normalizePath(targetPath);
  }

  return joinPath(basePath, targetPath);
}

export function dirname(path) {
  const normalized = normalizePath(path);
  const { root } = splitRoot(normalized);
  const body = normalized.slice(root.length);
  const parts = body.split("/").filter(Boolean);

  if (parts.length <= 1) {
    return root || ".";
  }

  parts.pop();
  return root ? `${root}${parts.join("/")}` : parts.join("/");
}

export function basename(path) {
  const normalized = normalizePath(path);
  if (normalized === "/" || /^[a-z]:$/.test(normalized)) {
    return normalized;
  }
  const parts = normalized.split("/");
  return parts[parts.length - 1];
}

export function extname(path) {
  const base = basename(path);
  const index = base.lastIndexOf(".");
  if (index <= 0) {
    return "";
  }
  return base.slice(index);
}

export function toComparablePath(path) {
  const normalized = normalizePath(path);
  if (/^[a-z]:/.test(normalized)) {
    return normalized.toLowerCase();
  }
  if (normalized.startsWith("//")) {
    return normalized.toLowerCase();
  }
  return normalized;
}

export function splitSegments(path) {
  const normalized = normalizePath(path);
  const { root } = splitRoot(normalized);
  const body = normalized.slice(root.length);
  return body.split("/").filter(Boolean);
}

export function getCurrentWorkingDirectory() {
  if (typeof os === "undefined" || typeof os.getcwd !== "function") {
    throw new Error("QuickJS os.getcwd is not available. Please run with --std enabled.");
  }
  const cwd = os.getcwd();
  if (Array.isArray(cwd)) {
    return normalizePath(cwd[0]);
  }
  return normalizePath(cwd);
}
