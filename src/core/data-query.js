import { isPlainObject } from "../lib/object-kind.js";

export function collectMatchedObjects(root) {
  const items = [];
  visit(root, items);
  return items;
}

function visit(node, items) {
  if (!isPlainObject(node)) {
    return;
  }

  if (typeof node.match === "string" && node.match.length > 0) {
    items.push(node);
  }

  for (const key of Object.keys(node)) {
    if (key === "parent") {
      continue;
    }

    const value = node[key];
    if (isPlainObject(value)) {
      visit(value, items);
    }
  }
}
