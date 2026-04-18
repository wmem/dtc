// 文件说明：
// 按点分路径读取全局对象中的值，用于实现只读的 get()。
import { isArray, isPlainObject } from "../lib/object-kind.js";

function isArrayIndex(segment) {
  return /^(0|[1-9]\d*)$/.test(segment);
}

// 读取目标对象上的点分路径字段，路径不存在时直接报错。
export function getPath(target, dottedPath) {
  if (!dottedPath || typeof dottedPath !== "string") {
    throw new Error("get() expects a non-empty dotted path string.");
  }

  const parts = dottedPath.split(".").filter(Boolean);
  if (parts.length === 0) {
    throw new Error("get() expects a valid dotted path string.");
  }

  let current = target;
  for (let i = 0; i < parts.length; i += 1) {
    const key = parts[i];
    const currentPath = parts.slice(0, i + 1).join(".");

    if (isArray(current)) {
      if (!isArrayIndex(key)) {
        throw new Error(`get() cannot access array with non-numeric key: ${currentPath}`);
      }

      const index = Number(key);
      if (index >= current.length) {
        throw new Error(`get() path does not exist: ${currentPath}`);
      }

      current = current[index];
      continue;
    }

    if (isPlainObject(current)) {
      if (!(key in current)) {
        throw new Error(`get() path does not exist: ${currentPath}`);
      }

      current = current[key];
      continue;
    }

    throw new Error(`get() cannot continue through non-object path: ${parts.slice(0, i).join(".") || "root"}`);
  }

  return current;
}
