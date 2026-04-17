# DTC

`dtc` 是一个运行在 QuickJS 上的模板生成工具，目标是从入口 JS 构建最终数据对象，筛选匹配模板的数据片段，使用 EJS 渲染后输出到目标文件。

## 设计约束

- 全部业务代码使用 JavaScript 实现。
- 运行时是 QuickJS，不能依赖 Node.js API，也不能依赖浏览器 API。
- 模板引擎固定为 EJS，当前仓库已提供可在 QuickJS 下加载的 `ejs.min.js`。
- 构建链路固定为 `esbuild -> qjs -c -> 可执行文件`。

## 当前状态

当前仓库只验证了两件事：

- `src/ejs/ejs-wrapper.js` 可以在 QuickJS 下挂载 EJS 所需的全局对象。
- `pbuild.sh` 可以把 `src/index.js` 打包为单文件，再交给 `qjs` 编译为可执行文件。

业务主流程尚未实现，当前 `src/index.js` 仍只是 EJS 渲染示例，不代表最终 CLI 行为。

## 阅读顺序

1. `doc/spec-vision.md`：整体目标、处理流程、边界和输出规则。
2. `doc/spec-config.md`：配置文件结构和路径解释规则。
3. `doc/spec-data-model.md`：入口 JS、`include()`、`remove()` 和全局数据合并语义。
4. `doc/spec-templates.md`：模板发现、`match` 匹配、渲染顺序和输出聚合。
5. `doc/spec-rendering.md`：EJS 上下文、模板能力和 QuickJS 约束。
6. `doc/architecture-build.md`：源码模块拆分建议和构建链路说明。
7. `doc/implementation-status.md`：当前实现覆盖情况和下一步落地顺序。

## 文档角色

- `doc/prot.md`：原始设计草案，保留为历史输入。
- `doc/spec-*.md`：正式规格，后续实现和测试以这些文档为准。
- `doc/implementation-status.md`：规格与代码对齐表，便于后续 AI 迭代。

## 构建

当前构建脚本是 `pbuild.sh`，流程如下：

1. 使用 `esbuild` 打包 `src/index.js` 为 `build/bundle.js`。
2. 使用 `bin/qjs-linux-x86_64` 将 bundle 编译为 Linux 可执行文件 `build/dtc`。
3. 使用同一 bundle 和 Windows 宿主可执行文件生成 `build/dtc.exe`。

这意味着最终实现必须保证入口逻辑在 QuickJS 环境中可独立运行。
