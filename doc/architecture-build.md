# 架构与构建说明

本文档描述 `dtc` 当前仓库中的真实模块划分、执行链路和构建方式。

## 当前代码组织

### 入口层

- `src/index.js`
  - 最小入口，只负责调用 `app/cil/main.js` 中的 `main()`。
- `src/version.js`
  - 保存项目版本号。
  - 作为代码中的唯一版本来源。

### `src/app/` 业务层

- `src/app/cil/main.js`
  - 解析命令行参数。
  - 响应 `--version`。
  - 打印用法与错误信息。
- `src/app/cil/run.js`
  - 串联配置解析、数据构建、模板发现、渲染、调试输出和写盘。
- `src/app/cil/version.js`
  - 输出 CLI 版本文本。
- `src/app/config/config.js`
  - 读取配置文件。
  - 解析 JSON。
  - 归一化和校验路径。
  - 检查重复输出路径。
- `src/app/data/data-loader.js`
  - 执行入口数据脚本。
  - 通过统一注册表暴露 `include()` / `remove()` / `replace()` / `update()` / `updateRoot()` / `get()`。
  - 管理加载栈和已加载集合。
- `src/app/data/script-globals.js`
  - 用数组集中定义数据脚本可用函数。
  - 同时维护函数签名和说明元信息。
  - 负责安装与恢复运行时全局函数。
- `src/app/data/replace-path.js`
  - 按点分路径直接替换值。
- `src/app/data/merge.js`
  - 深合并对象。
  - 类型不匹配时报错。
- `src/app/data/object-meta.js`
  - 为普通对象补充 `name`。
- `src/app/data/remove-path.js`
  - 删除点分路径。
- `src/app/data/update-path.js`
  - 以对象补丁方式更新或新增点分路径。
- `src/app/data/update-root.js`
  - 把对象补丁直接合并到全局根对象。
- `src/app/data/get-path.js`
  - 读取点分路径，支持数组下标访问。
- `src/app/data/data-query.js`
  - 搜索带 `match` 且 `enable === true` 的对象。
  - 只遍历普通对象，不进入数组。
- `src/app/template/template-discovery.js`
  - 展开 `files` 通配符。
  - 模板文件稳定去重。
- `src/app/template/template-match.js`
  - `match` 与模板文件名匹配。
- `src/app/template/render-task.js`
  - 单任务渲染。
  - 片段顺序拼接。
- `src/app/template/output-writer.js`
  - 确保输出目录存在。
  - 一次性写入目标文件。
- `src/app/debug/debug-output.js`
  - 负责调试 JSON 的安全导出。

### `src/lib/` 公共与运行时适配层

- `src/lib/runtime/fs.js`
  - 基于 QuickJS 可用能力封装文件读写。
- `src/lib/runtime/path.js`
  - 提供路径拼接、规范化和相对路径解析。
  - 提供 Linux / Windows 绝对路径判断与统一比较键。
- `src/lib/runtime/glob.js`
  - 实现受限的 glob 展开能力。
- `src/lib/runtime/args.js`
  - 读取 CLI 参数。
- `src/lib/runtime/print.js`
  - 统一错误与普通信息输出。
- `src/lib/utils/pattern.js`
  - 封装通配符匹配。
  - 同时服务于模板文件发现和 `match` 匹配。
- `src/lib/utils/object-kind.js`
  - 统一识别普通对象、数组、`null` 和标量类型。
- `src/lib/ejs/ejs-wrapper.js`
  - 为 EJS 提供 QuickJS 兼容环境。
- `src/lib/ejs/ejs.min.js`
  - EJS 预构建产物。

## 执行链路

当前 CLI 执行链路如下：

1. `src/index.js` 调用 `main()`
2. `src/app/cil/main.js` 处理参数和 `--version`
3. `src/app/cil/run.js` 调用 `loadConfig()`
4. `buildGlobalData()` 执行数据脚本并构建最终全局对象
5. `collectMatchedObjects()` 收集可渲染对象
6. `discoverTemplates()` 解析每个任务的模板列表
7. `renderTask()` 用 EJS 按对象逐个渲染
8. `writeOutputFile()` 写入最终输出
9. 如配置了调试输出，则通过 `debug-output.js` 写出 JSON 快照

## 为什么把运行时适配放在 `src/lib/runtime/`

项目不能依赖 Node.js API，也不能直接依赖浏览器 API，因此文件系统、路径、参数和 glob 相关逻辑需要单独封装。当前把这些实现放在 `src/lib/runtime/`，目的是：

- 让业务逻辑聚焦在 `src/app/`
- 把 QuickJS 相关细节限制在明确边界内
- 方便模板、配置和数据层共享同一套底层能力

## 构建链路

当前 `pbuild.sh` 采用如下流程：

1. `esbuild src/index.js --bundle --minify --format=esm --external:qjs:* --outfile=build/bundle.js`
2. `bin/qjs-linux-x86_64 --std -c build/bundle.js -o build/dtc.run --exe bin/qjs-linux-x86_64`
3. `bin/qjs-linux-x86_64 --std -c build/bundle.js -o build/dtc.exe --exe bin/qjs-windows-x86_64.exe`

构建产物包括：

- `build/bundle.js`
- `build/dtc.run`
- `build/dtc.exe`

## 构建约束

- 入口保持为 ESM。
- Bundle 中不能残留 Node.js 内建模块依赖。
- `qjs:*` 内建模块通过 `--external:qjs:*` 保留给 QuickJS 运行时处理。
- 与平台相关的行为尽量集中在 `src/lib/runtime/*`。
- 复用逻辑优先沉淀在 `src/lib/*`，避免在多个业务模块复制实现。

## CLI 行为

当前 CLI 支持：

```sh
dtc path/to/dtc.json
dtc --version
```

行为约定：

- 参数缺失或多余时打印用法并返回非零退出码。
- 参数为 `--version` 时输出版本号并正常退出。
- 其他情况下将唯一参数视为配置文件路径。
- 所有错误统一输出到标准错误。
