// 文件说明：
// 按点分路径更新对象字段，用于实现真正的 update() 合并语义。
import { getValueKind, isPlainObject } from "../../lib/utils/object-kind.js";
import { mergeInto } from "./merge.js";

function getOrCreateParent(target, parts) {
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

    return current;
}

// 以深合并方式更新目标路径上的对象，必要时自动创建缺失的中间对象。
export function updatePath(target, dottedPath, patch) {
    if (!dottedPath || typeof dottedPath !== "string") {
        throw new Error("update() expects a non-empty dotted path string.");
    }

    const parts = dottedPath.split(".").filter(Boolean);
    if (parts.length === 0) {
        throw new Error("update() expects a valid dotted path string.");
    }

    const current = getOrCreateParent(target, parts);
    const targetKey = parts[parts.length - 1];
    const fullPath = parts.join(".");

    if (isPlainObject(patch)) {
        if (!(targetKey in current)) {
            current[targetKey] = {};
        } else if (!isPlainObject(current[targetKey])) {
            throw new Error(`update() target must be a plain object: ${fullPath}`);
        }

        mergeInto(current[targetKey], patch, fullPath);
        return;
    }

    if (!(targetKey in current)) {
        throw new Error(`update() target path does not exist for non-object value: ${fullPath}`);
    }

    const targetValue = current[targetKey];
    const targetKind = getValueKind(targetValue);
    const patchKind = getValueKind(patch);
    if (targetKind !== patchKind) {
        throw new Error(`update() value kind mismatch at ${fullPath}: ${targetKind} !== ${patchKind}`);
    }

    current[targetKey] = patch;
}
