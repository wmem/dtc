export function isArray(value) {
  return Array.isArray(value);
}

export function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }

  if (isArray(value)) {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function getValueKind(value) {
  if (value === null) {
    return "null";
  }

  if (isArray(value)) {
    return "array";
  }

  if (isPlainObject(value)) {
    return "object";
  }

  return typeof value;
}

export function isScalarValue(value) {
  const kind = getValueKind(value);
  return kind !== "object" && kind !== "array";
}
