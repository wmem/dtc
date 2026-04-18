// 文件说明：
// 提供统一的值类型判断工具，供合并和遍历逻辑复用。
// 判断值是否为数组。
export function isArray(value) {
  return Array.isArray(value);
}

// 判断值是否为普通对象，排除 null、数组和类实例。
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

// 把输入值归一化为 dtc 内部使用的类型标签。
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

// 判断值是否为可直接覆盖的标量类型。
export function isScalarValue(value) {
  const kind = getValueKind(value);
  return kind !== "object" && kind !== "array";
}
