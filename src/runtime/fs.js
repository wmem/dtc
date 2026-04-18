import * as std from "qjs:std";
import * as os from "qjs:os";
import { dirname, normalizePath } from "./path.js";

function decodeStatus(result, action, path) {
  if (!Array.isArray(result) || result.length < 2) {
    return result;
  }

  const [value, errorCode] = result;
  if (errorCode && errorCode !== 0) {
    throw new Error(`${action} failed for ${path}: errno ${errorCode}`);
  }
  return value;
}

export function readTextFile(path) {
  const text = std.loadFile(path);
  if (text === null) {
    throw new Error(`Unable to read file: ${path}`);
  }
  return text;
}

export function writeTextFile(path, content) {
  const file = std.open(path, "w");
  if (!file) {
    throw new Error(`Unable to open file for writing: ${path}`);
  }

  try {
    file.puts(content);
    file.flush();
  } finally {
    file.close();
  }
}

export function statPath(path) {
  return decodeStatus(os.stat(path), "stat", path);
}

export function pathExists(path) {
  const result = os.stat(path);
  return Array.isArray(result) ? result[1] === 0 : !!result;
}

export function isDirectory(path) {
  const stat = statPath(path);
  return !!(stat.mode & 0o040000);
}

export function readDirectory(path) {
  const entries = decodeStatus(os.readdir(path), "readdir", path);
  return entries.filter((entry) => entry !== "." && entry !== "..");
}

export function ensureDirectory(path) {
  const normalized = normalizePath(path);
  if (normalized === "." || normalized === "/") {
    return;
  }

  const parent = dirname(normalized);
  if (parent !== normalized && parent !== "." && !pathExists(parent)) {
    ensureDirectory(parent);
  }

  if (pathExists(normalized)) {
    if (!isDirectory(normalized)) {
      throw new Error(`Path exists but is not a directory: ${normalized}`);
    }
    return;
  }

  const result = os.mkdir(normalized, 0o755);
  if (result && result !== 0) {
    throw new Error(`mkdir failed for ${normalized}: errno ${result}`);
  }
}

export function ensureParentDirectory(path) {
  ensureDirectory(dirname(path));
}

export function walkDirectory(path, visitor) {
  for (const entry of readDirectory(path)) {
    const child = normalizePath(`${path}/${entry}`);
    if (isDirectory(child)) {
      visitor(child, true);
      walkDirectory(child, visitor);
    } else {
      visitor(child, false);
    }
  }
}
