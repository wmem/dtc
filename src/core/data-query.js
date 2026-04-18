// 文件说明：
// 递归遍历最终全局对象，收集所有可参与模板渲染的 match 对象。
import { isPlainObject } from "../lib/object-kind.js";

// 收集所有带 match 的普通对象，供模板阶段统一过滤。
export function collectMatchedObjects(root) {
  const items = [];
  visit(root, items);
  return items;
}

// 深度优先遍历对象树，但不会进入数组内部。
function visit(node, items) {
  if (!isPlainObject(node)) {
    return;
  }

  if (typeof node.match === "string" && node.match.length > 0) {
    items.push(node);
  }

  for (const key of Object.keys(node)) {
    // parent 是运行时回指，跳过它可以避免在对象树中形成环。
    if (key === "parent") {
      continue;
    }

    const value = node[key];
    if (isPlainObject(value)) {
      visit(value, items);
    }
  }
}
