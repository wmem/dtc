# 实现状态

本文档用于把当前代码与正式规格对齐，后续每次迭代后都应更新。

## 状态定义

- `done`：已经实现并可用于主流程。
- `partial`：已有基础，但还不能独立支撑主流程。
- `todo`：尚未实现。

## 总览

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| QuickJS 下加载 EJS | done | `src/lib/ejs/ejs-wrapper.js` 已接入正式渲染流程，模板任务通过它调用 `ejs.render()`。 |
| 构建 bundle | done | `pbuild.sh` 已可用 `esbuild` 打包完整 CLI。 |
| 编译可执行文件 | done | `pbuild.sh` 可以产出 `build/dtc.run` 和 `build/dtc.exe`，并支持通过 `qjs:std` / `qjs:os` 内建模块访问运行时能力。 |
| CLI 参数处理 | done | `src/index.js` 通过 `src/app/cil/main.js` 实现参数解析和用法提示。 |
| 版本管理 | done | 已支持 `dtc --version`，并由 `src/version.js` 统一维护版本号。 |
| 配置读取与校验 | done | `src/app/config/config.js` 已实现 `data` / `tpl` 的解析、校验和输出冲突检查。 |
| 路径归一化 | done | `src/lib/runtime/path.js` 已实现跨平台路径规范化、绝对路径判断和比较键。 |
| 入口数据执行 | done | `src/app/data/data-loader.js` 已能从入口脚本构建最终全局对象。 |
| `include()` | done | 已支持同步包含、相对路径解析和循环包含检测。 |
| `remove()` | done | 已支持点分路径删除。 |
| `replace()` | done | 已支持点分路径直接替换与缺失路径自动创建。 |
| `update()` | done | 已支持对象补丁深合并，也支持对已存在且类型匹配的非对象值直接更新。 |
| `updateRoot()` | done | 已支持把对象补丁直接深合并到全局根对象。 |
| `get()` | done | 已支持点分路径读取，且允许通过数字下标访问数组项。 |
| 无默认导出数据脚本 | done | 已支持只执行副作用逻辑、不额外合并默认对象的数据脚本。 |
| 深合并规则 | done | `src/app/data/merge.js` 已实现深合并与类型不匹配报错。 |
| 对象元信息补充 | done | `src/app/data/object-meta.js` 已补充 `name`，模板渲染时会临时提供 `parent`。 |
| 模板 glob 搜索 | done | `src/lib/runtime/glob.js` 与 `src/app/template/template-discovery.js` 已实现模板发现与去重。 |
| 通配符公共库 | done | `src/lib/utils/pattern.js` 已供 glob 与 `match` 共享。 |
| `match` 数据搜索 | done | `src/app/data/data-query.js` 已按“只遍历普通对象、不进入数组、且要求 enable=true”实现搜索。 |
| EJS 正式渲染上下文 | done | 已按 `item/parent/root/template/output` 提供上下文。 |
| EJS 自定义左右标识 | done | 已支持通过配置文件中的 `ejs.openDelimiter` / `ejs.closeDelimiter` 自定义模板外层标识，未配置时使用默认值。 |
| 调试输出文件 | done | 已支持输出全局对象快照和模板命中对象明细。 |
| 输出聚合与写盘 | done | 已实现片段拼接、目录创建和最终写入。 |
| 错误处理与退出码 | done | 源码模式、bundle 模式和独立可执行文件都能给出清晰错误并以非零状态退出。 |

## 当前代码现状

### `src/index.js`

- 已作为正式 CLI 入口。
- 当前仅负责调用 `src/app/cil/main.js` 中的 `main()`。

### `src/app/cil/*`

- `main.js` 负责参数解析、版本输出、用法提示和统一错误处理。
- `run.js` 负责串联配置解析、数据构建、模板发现、渲染、调试输出和写盘。
- `version.js` 负责打印版本字符串。

### `src/lib/ejs/ejs-wrapper.js`

- 已处理 `window`、`global`、`self` 到 `globalThis` 的映射。
- 已通过 `await import("./ejs.min.js")` 暴露 `globalThis.ejs`。
- 可继续复用于正式实现。

### `pbuild.sh`

- 已固定 `esbuild -> qjs` 的构建链路。
- 默认输出 `build/dtc.run` 和 `build/dtc.exe`。
- `build/bundle.js` 可直接通过 `bin/qjs-linux-x86_64` 正常运行。
- 独立可执行文件通过 `qjs:std` / `qjs:os` 内建模块访问 QuickJS 运行时能力。
- 调试输出可通过配置中的 `debugDataOut` / `debugMatchOut` 打开。

## 推荐下一步

1. 为路径归一化、glob 和数据加载顺序补充更细粒度的单项测试。
2. 增加一个最小示例工程，便于验证模板渲染输出。
3. 如需扩展模板能力，再讨论 helper、separator、encoding 等未来字段。

## 更新规则

后续每次提交代码后，至少更新两部分：

- 总览表中的状态。
- 受影响模块的小节说明。
