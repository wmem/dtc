// 文件说明：
// 为最终全局对象中的普通对象补充 name 和 parent 两个运行时字段。
import { isPlainObject } from "../lib/object-kind.js";

// 从根对象开始递归补充对象元信息。
export function applyObjectMetadata(root) {
  decorate(root, undefined, "root");
  return root;
}

// 深度优先遍历对象树，按父子关系写入 name 和 parent。
function decorate(current, parent, name) {
  if (!isPlainObject(current)) {
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(current, "name")) {
    current.name = name;
  }

  current.parent = parent;

  for (const key of Object.keys(current)) {
    if (key === "parent") {
      continue;
    }

    const value = current[key];
    if (isPlainObject(value)) {
      decorate(value, current, key);
    }
  }
}
