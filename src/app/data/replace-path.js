// 文件说明：
// 按点分路径直接替换字段，用于实现 replace()。
import { isPlainObject } from "../../lib/utils/object-kind.js";

// 直接替换目标对象上的点分路径字段，必要时自动创建缺失的中间对象。
export function replacePath(target, dottedPath, value) {
    if (!dottedPath || typeof dottedPath !== "string") {
        throw new Error("replace() expects a non-empty dotted path string.");
    }

    const parts = dottedPath.split(".").filter(Boolean);
    if (parts.length === 0) {
        throw new Error("replace() expects a valid dotted path string.");
    }

    let current = target;
    for (let i = 0; i < parts.length - 1; i += 1) {
        const key = parts[i];

        if (!(key in current)) {
            current[key] = {};
        } else if (!isPlainObject(current[key])) {
            throw new Error(`replace() cannot create nested property through non-object path: ${parts.slice(0, i + 1).join(".")}`);
        }

        current = current[key];
    }

    current[parts[parts.length - 1]] = value;
}
