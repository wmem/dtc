// 文件说明：
// 为最终全局对象中的普通对象补充 name 字段，不把 parent 写回对象本身。
import { isPlainObject } from "../../lib/utils/object-kind.js";

// 从根对象开始递归补充对象名称信息。
export function applyObjectMetadata(root) {
    decorate(root, "root");
    return root;
}

// 深度优先遍历对象树，按父子关系写入 name。
function decorate(current, name) {
    if (!isPlainObject(current)) {
        return;
    }

    if (!Object.prototype.hasOwnProperty.call(current, "name")) {
        current.name = name;
    }

    for (const key of Object.keys(current)) {
        const value = current[key];
        if (isPlainObject(value)) {
            decorate(value, key);
        }
    }
}
