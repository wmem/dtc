import { getValueKind, isPlainObject, isArray, isScalarValue } from "../lib/object-kind.js";

function formatPath(path) {
  return path || "root";
}

export function mergeInto(target, source, path = "") {
  if (!isPlainObject(source)) {
    throw new Error(`Data file default export must be a plain object at ${formatPath(path)}`);
  }

  for (const key of Object.keys(source)) {
    const nextPath = path ? `${path}.${key}` : key;
    const sourceValue = source[key];

    if (!(key in target)) {
      target[key] = sourceValue;
      continue;
    }

    const targetValue = target[key];
    const targetKind = getValueKind(targetValue);
    const sourceKind = getValueKind(sourceValue);

    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      mergeInto(targetValue, sourceValue, nextPath);
      continue;
    }

    if (isArray(targetValue) && isArray(sourceValue)) {
      target[key] = sourceValue;
      continue;
    }

    if (targetKind === "null" && sourceKind === "null") {
      target[key] = null;
      continue;
    }

    if (isScalarValue(targetValue) && isScalarValue(sourceValue) && targetKind === sourceKind) {
      target[key] = sourceValue;
      continue;
    }

    throw new Error(`对象不匹配，无法合并: ${formatPath(nextPath)} (${targetKind} !== ${sourceKind})`);
  }

  return target;
}
