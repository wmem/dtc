// 文件说明：
// 负责执行入口数据脚本，处理 include()/remove()/replace()/update()/updateRoot()/get()，并构建最终全局对象。
import * as std from "qjs:std";
import { isPlainObject } from "../../lib/utils/object-kind.js";
import { readTextFile } from "../../lib/runtime/fs.js";
import { normalizePath, toComparablePath } from "../../lib/runtime/path.js";
import { toDebugJsonValue } from "../debug/debug-output.js";
import { mergeInto } from "./merge.js";
import { applyObjectMetadata } from "./object-meta.js";
import { installDataScriptGlobals } from "./script-globals.js";

// 把数据脚本改写成可被 std.evalScript 同步执行的形式。
function transformDataModule(source, filePath) {
    const exportRegex = /\bexport\s+default\b/;
    // 数据脚本只允许通过 include() 组织依赖，避免引入异步模块语义。
    if (/\bimport\s+[^("'`]/.test(source) || /\bimport\s*\(/.test(source)) {
        throw new Error(`Data file import is not supported in dtc data modules: ${filePath}`);
    }

    const transformed = source.replace(exportRegex, "__dtc_default_export__ =");
    return [
        "(() => {",
        "  let __dtc_default_export__;",
        transformed,
        "  return __dtc_default_export__;",
        "})()",
        `//# sourceURL=${filePath}`,
    ].join("\n");
}

// 同步执行单个数据脚本并返回默认导出对象；无默认导出时返回 undefined。
function executeDataModule(filePath) {
    const source = readTextFile(filePath);
    const wrappedSource = transformDataModule(source, filePath);
    return std.evalScript(wrappedSource);
}

// 按 include 语义加载单个模块，并把默认导出并入全局对象。
function loadModule(filePath, state) {
    const normalizedFile = normalizePath(filePath);
    const comparablePath = toComparablePath(normalizedFile);

    if (state.loadedFiles.has(comparablePath)) {
        return;
    }

    // 通过当前加载栈检测循环 include。
    const loadingIndex = state.loadingStack.findIndex((item) => item === comparablePath);
    if (loadingIndex !== -1) {
        const cycle = state.loadingStack.slice(loadingIndex).concat(comparablePath).join(" -> ");
        throw new Error(`Circular include detected: ${cycle}`);
    }

    state.loadingStack.push(comparablePath);
    state.fileStack.push(normalizedFile);

    try {
        const exported = executeDataModule(normalizedFile);
        if (exported !== undefined && !isPlainObject(exported)) {
            throw new Error(`Default export must be a plain object: ${normalizedFile}`);
        }
        if (exported !== undefined) {
            mergeInto(state.globalData, exported);
        }
        state.loadedFiles.add(comparablePath);
    } catch (error) {
        throw new Error(`Failed to load data file ${normalizedFile}: ${error.message}`);
    } finally {
        state.fileStack.pop();
        state.loadingStack.pop();
    }
}

// 从入口文件开始构建最终全局对象，并注入对象元信息。
export function buildGlobalData(entryPath, options = {}) {
    const normalizedEntry = normalizePath(entryPath);
    const state = {
        globalData: {},
        loadedFiles: new Set(),
        loadingStack: [],
        fileStack: [],
    };

    // 数据脚本可用函数统一在定义数组中注册，后续新增能力时只需要追加一项。
    const restoreGlobals = installDataScriptGlobals(state, loadModule);

    try {
        loadModule(normalizedEntry, state);
        if (typeof options.onBeforeMetadata === "function") {
            // 此时对象树还未注入 parent/name，可直接导出为无循环引用的快照。
            options.onBeforeMetadata(toDebugJsonValue(state.globalData));
        }
        applyObjectMetadata(state.globalData);
        return state.globalData;
    } finally {
        restoreGlobals();
    }
}
