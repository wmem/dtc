// 文件说明：
// 按点分路径从全局对象中删除字段，用于实现 remove()。
import { isPlainObject } from "../../lib/utils/object-kind.js";

// 删除目标对象上的点分路径字段，不存在时静默忽略。
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
