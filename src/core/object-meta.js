import { isPlainObject } from "../lib/object-kind.js";

export function applyObjectMetadata(root) {
  decorate(root, undefined, "root");
  return root;
}

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
