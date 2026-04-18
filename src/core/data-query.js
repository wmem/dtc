// 文件说明：
// 递归遍历最终全局对象，收集所有满足 match + enable=true 的可渲染对象。
import { isPlainObject } from "../lib/object-kind.js";

// 收集所有满足模板渲染条件的普通对象，供模板阶段统一过滤。
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

  if (node.enable === true && typeof node.match === "string" && node.match.length > 0) {
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
