// 文件说明：
// 按点分路径更新或新增字段，用于实现 update()。
import { isPlainObject } from "../lib/object-kind.js";

// 更新目标对象上的点分路径字段，必要时自动创建缺失的中间对象。
export function updatePath(target, dottedPath, value) {
  if (!dottedPath || typeof dottedPath !== "string") {
    throw new Error("update() expects a non-empty dotted path string.");
  }

  const parts = dottedPath.split(".").filter(Boolean);
  if (parts.length === 0) {
    throw new Error("update() expects a valid dotted path string.");
  }

  let current = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];

    if (!(key in current)) {
      current[key] = {};
    } else if (!isPlainObject(current[key])) {
      throw new Error(`update() cannot create nested property through non-object path: ${parts.slice(0, i + 1).join(".")}`);
    }

    current = current[key];
  }

  current[parts[parts.length - 1]] = value;
}
