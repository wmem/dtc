// 文件说明：
// 负责生成可写入调试文件的 JSON 数据，避免运行时对象中的循环引用直接进入输出。
import { isArray, isPlainObject } from "../../lib/utils/object-kind.js";
import { writeOutputFile } from "../template/output-writer.js";

// 把任意值转换为适合调试输出的 JSON 结构，可选择忽略部分字段。
export function toDebugJsonValue(value, options = {}) {
    const ignoreKeys = options.ignoreKeys || new Set();
    return cloneValue(value, ignoreKeys);
}

// 把调试数据格式化后写入指定文件。
export function writeDebugJson(outputPath, value) {
    writeOutputFile(outputPath, `${JSON.stringify(value, null, 2)}\n`);
}

// 递归克隆输入值，仅保留可被 JSON 表达的结构。
function cloneValue(value, ignoreKeys) {
    if (isArray(value)) {
        return value.map((item) => cloneValue(item, ignoreKeys));
    }

    if (isPlainObject(value)) {
        const result = {};
        for (const key of Object.keys(value)) {
            if (ignoreKeys.has(key)) {
                continue;
            }
            result[key] = cloneValue(value[key], ignoreKeys);
        }
        return result;
    }

    return value;
}
