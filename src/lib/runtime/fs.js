// 文件说明：
// 对 QuickJS 的 qjs:std / qjs:os 做轻量封装，统一处理文件与目录操作。
import * as std from "qjs:std";
import * as os from "qjs:os";
import { dirname, normalizePath } from "./path.js";

// 解析 qjs:os 的返回格式，统一把 errno 转成异常。
function decodeStatus(result, action, path) {
    if (!Array.isArray(result) || result.length < 2) {
        return result;
    }

    const [value, errorCode] = result;
    if (errorCode && errorCode !== 0) {
        throw new Error(`${action} failed for ${path}: errno ${errorCode}`);
    }
    return value;
}

// 读取文本文件内容。
export function readTextFile(path) {
    const text = std.loadFile(path);
    if (text === null) {
        throw new Error(`Unable to read file: ${path}`);
    }
    return text;
}

// 覆盖写入文本文件。
export function writeTextFile(path, content) {
    const file = std.open(path, "w");
    if (!file) {
        throw new Error(`Unable to open file for writing: ${path}`);
    }

    try {
        file.puts(content);
        file.flush();
    } finally {
        file.close();
    }
}

// 获取文件或目录状态信息。
export function statPath(path) {
    return decodeStatus(os.stat(path), "stat", path);
}

// 判断路径是否存在。
export function pathExists(path) {
    const result = os.stat(path);
    return Array.isArray(result) ? result[1] === 0 : !!result;
}

// 判断路径是否为目录。
export function isDirectory(path) {
    const stat = statPath(path);
    return !!(stat.mode & 0o040000);
}

// 读取目录项，并过滤掉 . 和 ..。
export function readDirectory(path) {
    const entries = decodeStatus(os.readdir(path), "readdir", path);
    return entries.filter((entry) => entry !== "." && entry !== "..");
}

// 递归创建目录，直到目标路径存在。
export function ensureDirectory(path) {
    const normalized = normalizePath(path);
    if (normalized === "." || normalized === "/") {
        return;
    }

    const parent = dirname(normalized);
    // 先确保父目录存在，再创建当前目录。
    if (parent !== normalized && parent !== "." && !pathExists(parent)) {
        ensureDirectory(parent);
    }

    if (pathExists(normalized)) {
        if (!isDirectory(normalized)) {
            throw new Error(`Path exists but is not a directory: ${normalized}`);
        }
        return;
    }

    const result = os.mkdir(normalized, 0o755);
    if (result && result !== 0) {
        throw new Error(`mkdir failed for ${normalized}: errno ${result}`);
    }
}

// 确保指定文件路径的父目录存在。
export function ensureParentDirectory(path) {
    ensureDirectory(dirname(path));
}

// 递归遍历目录树，并把每个子路径交给 visitor 处理。
export function walkDirectory(path, visitor) {
    for (const entry of readDirectory(path)) {
        const child = normalizePath(`${path}/${entry}`);
        if (isDirectory(child)) {
            visitor(child, true);
            walkDirectory(child, visitor);
        } else {
            visitor(child, false);
        }
    }
}
