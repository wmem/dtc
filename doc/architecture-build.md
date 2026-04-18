# 架构与构建说明

本文档描述 `dtc` 的建议源码拆分、运行时依赖边界和构建链路。

## 当前已有基础

当前仓库中已经存在：

- `src/index.js`：最小入口示例。
- `src/ejs/ejs-wrapper.js`：为 EJS 提供 QuickJS 兼容的全局对象环境。
- `src/ejs/ejs.min.js`：EJS 预构建产物。
- `pbuild.sh`：打包和生成可执行文件的脚本。

## 目标架构

建议将后续实现拆为以下层次：

### 入口层

- `src/index.js`
  - 解析命令行参数。
  - 读取配置文件。
  - 响应 `--version`。
  - 调用主流程。
  - 输出错误并设置退出码。
- `src/version.js`
  - 保存项目版本号。
  - 作为代码中的唯一版本来源。

### 编排层

- `src/core/run.js`
  - 串联配置解析、数据构建、模板任务执行和输出写入。

### 配置层

- `src/core/config.js`
  - 读取配置文件。
  - 解析 JSON。
  - 归一化和校验路径。
  - 统一处理 Linux 与 Windows 绝对路径规则。

### 数据层

- `src/core/data-loader.js`
  - 执行入口模块。
  - 暴露 `include()` / `remove()` / `update()` / `get()`。
  - 管理模块加载栈和已加载集合。
- `src/core/merge.js`
  - 深合并对象。
  - 类型不匹配时报错。
- `src/core/object-meta.js`
  - 为普通对象补充 `name` 与 `parent`。
- `src/core/remove-path.js`
  - 删除点分路径。
- `src/core/update-path.js`
  - 更新或新增点分路径。
- `src/core/get-path.js`
  - 读取点分路径，支持数组下标访问。
- `src/core/data-query.js`
  - 搜索带 `match` 的对象。
  - 只遍历普通对象，不进入数组。

### 模板层

- `src/core/template-discovery.js`
  - 展开 `files` 通配符。
  - 模板文件去重和排序。
- `src/core/template-match.js`
  - `match` 与模板文件名匹配。
- `src/core/render-task.js`
  - 单任务渲染。
  - 片段顺序拼接。

### 运行时适配层

- `src/runtime/fs.js`
  - 基于 QuickJS 可用能力封装文件读写。
- `src/runtime/path.js`
  - 提供最小路径拼接、规范化和相对路径解析。
  - 提供 Linux / Windows 绝对路径判断与统一比较键。
- `src/runtime/glob.js`
  - 实现受限的 glob 展开能力。

### 公共库层

- `src/lib/pattern.js`
  - 统一封装通配符匹配。
  - 同时服务于模板文件发现和 `match` 匹配。
- `src/lib/object-kind.js`
  - 统一识别普通对象、数组、`null` 和标量类型，避免合并逻辑分散重复。

### 输出层

- `src/core/output-writer.js`
  - 确保输出目录存在。
  - 一次性写入目标文件。

## 为什么要单独做运行时适配层

项目不能依赖 Node.js API，也不能直接依赖浏览器 API，因此文件系统、路径和 glob 相关逻辑不能直接照搬 Node 生态写法。单独做 `src/runtime/*` 有三个好处：

- 业务逻辑和 QuickJS 细节隔离。
- 后续替换实现时影响面更小。
- AI 迭代时更容易定位边界。

对于通配符匹配、类型判断这类会被多处用到的逻辑，应优先沉淀到公共库，再由业务模块通过 `import` 复用。

## 构建链路

当前 `pbuild.sh` 采用如下流程：

1. `esbuild src/index.js --bundle --minify --format=esm --outfile=build/bundle.js`
2. `qjs-linux-x86_64 -c build/bundle.js -o build/dtc --exe bin/qjs-linux-x86_64`
3. `qjs-linux-x86_64 -c build/bundle.js -o build/dtc.exe --exe bin/qjs-windows-x86_64.exe`

## 构建要求

- 入口必须保持为 ESM。
- Bundle 里不能残留 Node.js 内建模块依赖。
- 所有运行时代码都必须可以被 `esbuild` 打进单文件。
- 与平台相关的行为尽量集中在 `src/runtime/*`。
- 重复性逻辑应尽量下沉到 `src/lib/*`，避免在多个业务模块复制相同实现。

## CLI 建议

建议首个版本支持如下调用方式：

```sh
dtc path/to/dtc.json
```

行为要求：

- 参数缺失时打印用法并返回非零退出码。
- 参数为 `--version` 时输出版本号并正常退出。
- 参数存在时把它视为配置文件路径。
- 所有错误都打印到标准错误输出。

## 模块落地顺序

建议按以下顺序实现代码：

1. `src/runtime/path.js`
2. `src/runtime/fs.js`
3. `src/lib/object-kind.js`
4. `src/lib/pattern.js`
5. `src/core/config.js`
6. `src/core/merge.js`
7. `src/core/remove-path.js`
8. `src/core/update-path.js`
9. `src/core/get-path.js`
10. `src/core/data-loader.js`
11. `src/core/object-meta.js`
12. `src/core/data-query.js`
13. `src/runtime/glob.js`
14. `src/core/template-discovery.js`
15. `src/core/template-match.js`
16. `src/core/render-task.js`
17. `src/core/output-writer.js`
18. `src/core/run.js`
19. `src/index.js`

这个顺序保证每一层都建立在前一层已稳定的抽象之上。
