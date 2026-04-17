import { isPlainObject } from "../lib/object-kind.js";

export function removePath(target, dottedPath) {
  if (!dottedPath || typeof dottedPath !== "string") {
    throw new Error("remove() expects a non-empty dotted path string.");
  }

  const parts = dottedPath.split(".").filter(Boolean);
  if (parts.length === 0) {
    return;
  }

  let current = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (!isPlainObject(current)) {
      return;
    }

    if (!(parts[i] in current)) {
      return;
    }

    current = current[parts[i]];
  }

  if (!isPlainObject(current)) {
    return;
  }

  delete current[parts[parts.length - 1]];
}
