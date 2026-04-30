// 文件说明：
// 统一定义数据脚本可用的全局函数及其元信息，便于后续集中扩展和复用说明文本。
import { dirname, resolvePath } from "../../lib/runtime/path.js";
import { getPath } from "./get-path.js";
import { removePath } from "./remove-path.js";
import { replacePath } from "./replace-path.js";
import { updatePath } from "./update-path.js";
import { updateRoot } from "./update-root.js";

function createInclude(state, loadModule) {
    return (targetPath) => {
        if (typeof targetPath !== "string" || targetPath.length === 0) {
            throw new Error("include() expects a non-empty path string.");
        }

        const currentFile = state.fileStack[state.fileStack.length - 1];
        if (!currentFile) {
            throw new Error("include() can only be used while a data file is being evaluated.");
        }

        const resolvedPath = resolvePath(dirname(currentFile), targetPath);
        loadModule(resolvedPath, state);
    };
}

function createRemove(state) {
    return (dottedPath) => {
        removePath(state.globalData, dottedPath);
    };
}

function createReplace(state) {
    return (dottedPath, value) => {
        replacePath(state.globalData, dottedPath, value);
    };
}

function createUpdate(state) {
    return (dottedPath, patch) => {
        updatePath(state.globalData, dottedPath, patch);
    };
}

function createUpdateRoot(state) {
    return (patch) => {
        updateRoot(state.globalData, patch);
    };
}

function createGet(state) {
    return (dottedPath) => {
        return getPath(state.globalData, dottedPath);
    };
}

export const DATA_SCRIPT_GLOBAL_DEFINITIONS = [
    {
        name: "include",
        signature: 'include(path)',
        description: "按当前脚本目录加载并执行另一个数据文件。",
        create: createInclude,
    },
    {
        name: "remove",
        signature: 'remove(path)',
        description: "从当前全局对象中删除点分路径对应的字段。",
        create: createRemove,
    },
    {
        name: "replace",
        signature: 'replace(path, value)',
        description: "直接替换点分路径上的值，必要时自动创建缺失路径。",
        create: createReplace,
    },
    {
        name: "update",
        signature: 'update(path, patchObject)',
        description: "把普通对象补丁深合并到指定路径的目标对象上。",
        create: createUpdate,
    },
    {
        name: "updateRoot",
        signature: 'updateRoot(patchObject)',
        description: "把普通对象补丁直接深合并到全局根对象。",
        create: createUpdateRoot,
    },
    {
        name: "get",
        signature: 'get(path)',
        description: "读取点分路径上的值，支持数组下标访问。",
        create: createGet,
    },
];

// 返回可用于文档或帮助信息的函数元数据，避免在多处重复维护说明文本。
export function getDataScriptGlobalMetadata() {
    return DATA_SCRIPT_GLOBAL_DEFINITIONS.map(({ name, signature, description }) => {
        return {
            name,
            signature,
            description,
        };
    });
}

// 安装数据脚本运行时所需的全局函数，并返回恢复函数。
export function installDataScriptGlobals(state, loadModule) {
    const previousValues = new Map();

    for (const definition of DATA_SCRIPT_GLOBAL_DEFINITIONS) {
        previousValues.set(definition.name, globalThis[definition.name]);
        globalThis[definition.name] = definition.create(state, loadModule);
    }

    return () => {
        for (const definition of DATA_SCRIPT_GLOBAL_DEFINITIONS) {
            globalThis[definition.name] = previousValues.get(definition.name);
        }
    };
}
