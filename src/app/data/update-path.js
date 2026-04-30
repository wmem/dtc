// 文件说明：
// 按点分路径更新对象字段，用于实现真正的 update() 合并语义。
import { isPlainObject } from "../../lib/utils/object-kind.js";
import { mergeInto } from "./merge.js";

// 以深合并方式更新目标路径上的对象，必要时自动创建缺失的中间对象。
export function updatePath(target, dottedPath, patch) {
    if (!dottedPath || typeof dottedPath !== "string") {
        throw new Error("update() expects a non-empty dotted path string.");
    }

    if (!isPlainObject(patch)) {
        throw new Error("update() expects a plain object patch.");
    }

    const parts = dottedPath.split(".").filter(Boolean);
    if (parts.length === 0) {
        throw new Error("update() expects a valid dotted path string.");
    }

    let current = target;
    for (let i = 0; i < parts.length - 1; i += 1) {
        const key = parts[i];

        if (!(key in current)) {
            current[key] = {};
        } else if (!isPlainObject(current[key])) {
            throw new Error(`update() cannot create nested property through non-object path: ${parts.slice(0, i + 1).join(".")}`);
        }

        current = current[key];
    }

    const targetKey = parts[parts.length - 1];
    if (!(targetKey in current)) {
        current[targetKey] = {};
    } else if (!isPlainObject(current[targetKey])) {
        throw new Error(`update() target must be a plain object: ${parts.join(".")}`);
    }

    mergeInto(current[targetKey], patch, parts.join("."));
}
