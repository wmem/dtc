// 文件说明：
// 直接把对象补丁深合并到全局根对象，用于实现 updateRoot()。
import { isPlainObject } from "../../lib/utils/object-kind.js";
import { mergeInto } from "./merge.js";

// 将普通对象补丁深合并到根对象。
export function updateRoot(target, patch) {
    if (!isPlainObject(patch)) {
        throw new Error("updateRoot() expects a plain object patch.");
    }

    mergeInto(target, patch);
}
