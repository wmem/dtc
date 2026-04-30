// 文件说明：
// 实现全局对象的深合并，并在类型冲突时给出明确错误。
import { getValueKind, isPlainObject, isArray, isScalarValue } from "../../lib/utils/object-kind.js";

// 格式化对象路径，便于错误信息定位。
function formatPath(path) {
    return path || "root";
}

// 按 dtc 规则把 source 递归合并到 target。
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

        // 只有同类值才能继续合并，否则按规范直接报错。
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
