# 实现状态

本文档用于把当前代码与正式规格对齐，后续每次迭代后都应更新。

## 状态定义

- `done`：已经实现并可用于主流程。
- `partial`：已有基础，但还不能独立支撑主流程。
- `todo`：尚未实现。

## 总览

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| QuickJS 下加载 EJS | partial | `src/ejs/ejs-wrapper.js` 已可用，但只验证了最小渲染场景。 |
| 构建 bundle | partial | `pbuild.sh` 已能调用 `esbuild` 打包 `src/index.js`。 |
| 编译可执行文件 | partial | `pbuild.sh` 已定义 `qjs` 编译步骤，但依赖本地 `bin/qjs-*` 准备完毕。 |
| CLI 参数处理 | todo | `src/index.js` 还没有解析配置文件路径。 |
| 配置读取与校验 | todo | 尚未实现 `data` / `tpl` 的解析和规范化。 |
| 路径归一化 | todo | 尚未抽出 QuickJS 可用的路径工具，也还未覆盖 Windows / Linux 差异。 |
| 入口数据执行 | todo | 尚未从入口 JS 构建最终全局对象。 |
| `include()` | todo | 仅存在设计说明，没有代码实现。 |
| `remove()` | todo | 仅存在设计说明，没有代码实现。 |
| 深合并规则 | todo | 尚未实现独立合并模块，也还没有类型不匹配时报错的能力。 |
| 对象关系字段补充 | todo | 尚未为对象补充 `name` 与 `parent`。 |
| 模板 glob 搜索 | todo | 尚未实现。 |
| 通配符公共库 | todo | 尚未抽出供 glob 与 `match` 共享的匹配实现。 |
| `match` 数据搜索 | todo | 尚未实现，且尚未按“只遍历普通对象、不进入数组”落地。 |
| EJS 正式渲染上下文 | todo | 还未按 `item/parent/root/template/output` 结构提供上下文。 |
| 输出聚合与写盘 | todo | 尚未实现。 |
| 错误处理与退出码 | todo | 尚未形成完整 CLI 错误路径。 |

## 当前代码现状

### `src/index.js`

- 只是一个 EJS 渲染示例。
- 没有配置读取。
- 没有文件系统操作。
- 没有模板任务执行逻辑。
- 没有任何跨平台路径处理。

### `src/ejs/ejs-wrapper.js`

- 已处理 `window`、`global`、`self` 到 `globalThis` 的映射。
- 已通过 `await import("./ejs.min.js")` 暴露 `globalThis.ejs`。
- 可继续复用于正式实现。

### `pbuild.sh`

- 已固定 `esbuild -> qjs` 的构建链路。
- 默认输出 `build/dtc` 和 `build/dtc.exe`。
- 说明正式实现必须保证 `src/index.js` 在 QuickJS 中可运行。

## 推荐下一步

1. 先实现 `src/runtime/path.js` 和 `src/runtime/fs.js`，建立 QuickJS 下的基础能力。
2. 再实现配置解析、数据执行和对象操作。
3. 最后实现模板发现、匹配、渲染和输出。

## 更新规则

后续每次提交代码后，至少更新两部分：

- 总览表中的状态。
- 受影响模块的小节说明。
