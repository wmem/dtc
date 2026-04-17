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
  - 调用主流程。
  - 输出错误并设置退出码。

### 编排层

- `src/core/run.js`
  - 串联配置解析、数据构建、模板任务执行和输出写入。

### 配置层

- `src/core/config.js`
  - 读取配置文件。
  - 解析 JSON。
  - 归一化和校验路径。

### 数据层

- `src/core/data-loader.js`
  - 执行入口模块。
  - 暴露 `include()` / `remove()`。
  - 管理模块加载栈和已加载集合。
- `src/core/merge.js`
  - 深合并对象。
- `src/core/remove-path.js`
  - 删除点分路径。
- `src/core/data-query.js`
  - 搜索带 `match` 的对象。

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
- `src/runtime/glob.js`
  - 实现受限的 glob 展开能力。

### 输出层

- `src/core/output-writer.js`
  - 确保输出目录存在。
  - 一次性写入目标文件。

## 为什么要单独做运行时适配层

项目不能依赖 Node.js API，也不能直接依赖浏览器 API，因此文件系统、路径和 glob 相关逻辑不能直接照搬 Node 生态写法。单独做 `src/runtime/*` 有三个好处：

- 业务逻辑和 QuickJS 细节隔离。
- 后续替换实现时影响面更小。
- AI 迭代时更容易定位边界。

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

## CLI 建议

建议首个版本支持如下调用方式：

```sh
dtc path/to/dtc.json
```

行为要求：

- 参数缺失时打印用法并返回非零退出码。
- 参数存在时把它视为配置文件路径。
- 所有错误都打印到标准错误输出。

## 模块落地顺序

建议按以下顺序实现代码：

1. `src/runtime/path.js`
2. `src/runtime/fs.js`
3. `src/core/config.js`
4. `src/core/merge.js`
5. `src/core/remove-path.js`
6. `src/core/data-loader.js`
7. `src/core/data-query.js`
8. `src/runtime/glob.js`
9. `src/core/template-discovery.js`
10. `src/core/template-match.js`
11. `src/core/render-task.js`
12. `src/core/output-writer.js`
13. `src/core/run.js`
14. `src/index.js`

这个顺序保证每一层都建立在前一层已稳定的抽象之上。
