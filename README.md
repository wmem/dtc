# DTC

`dtc` 是一个运行在 QuickJS 上的模板生成工具。它会读取一个 JSON 配置文件，执行入口数据脚本构建最终全局对象，筛选匹配模板的数据对象，再使用 EJS 渲染并输出目标文件。

## 特性

- 纯 JavaScript 实现，运行时为 QuickJS
- 使用 `qjs:std`、`qjs:os` 访问 QuickJS 内建能力
- 支持 `include()`、`remove()`、`replace()`、`update()` 和 `get()` 构建全局对象
- 支持模板文件通配符搜索
- 支持对象 `match` 通配符匹配模板文件名
- 自动为普通对象补充 `name`，并在模板渲染时提供 `parent`
- 支持打包为 Linux / Windows 可执行文件

## 版本管理

- 当前版本由 `src/version.js` 统一管理
- 如果要修改版本号，只需要改这一个文件
- CLI 可通过以下命令查看版本：

```sh
build/dtc.run --version
```

或：

```sh
bin/qjs-linux-x86_64 src/index.js --version
```

## 设计约束

- 全部业务代码使用 JavaScript 实现
- 运行时是 QuickJS，不能依赖 Node.js API，也不能依赖浏览器 API
- 模板引擎固定为 EJS，当前通过 `src/lib/ejs/ejs-wrapper.js` 适配到 QuickJS
- 构建链路固定为 `esbuild -> qjs -c -> 可执行文件`
- 路径处理同时兼容 Linux 和 Windows，包括相对路径、绝对路径和分隔符差异

## 当前状态

当前主流程已经可用，已经实现：

- 配置读取与校验
- 数据脚本执行、`include()`、`remove()`
- 全局对象深合并与类型冲突报错
- `name` 元信息补充与渲染期 `parent`
- 模板发现、`match` 匹配与 EJS 渲染
- 输出写盘
- 打包为 `build/bundle.js`、`build/dtc.run`、`build/dtc.exe`
- 多组集成测试

## 目录结构

```text
.
├── bin/                    QuickJS 可执行文件
├── build/                  构建产物
├── doc/                    设计文档与规格文档
├── src/
│   ├── app/                CLI、配置、数据、模板与调试等业务代码
│   ├── lib/                QuickJS 运行时适配、EJS 包装与公共工具
│   └── index.js            CLI 入口
├── test/
│   ├── case-basic/         基础成功用例
│   ├── case-enable-filter/ enable=true 过滤用例
│   ├── case-empty-output/  无匹配输出用例
│   ├── case-get-missing/   get() 读取缺失路径报错用例
│   ├── case-type-mismatch/ 合并类型冲突用例
│   ├── case-circular/      循环 include 用例
│   ├── case-wildcard/      通配符匹配用例
│   └── test.js             测试入口
└── pbuild.sh               构建脚本
```

## 核心流程

1. 读取 `dtc.json`
2. 执行 `data` 指定的入口脚本
3. 在执行期间处理 `include()`、`remove()`、`replace()`、`update()` 和 `get()`
4. 合并所有存在默认导出的对象，得到最终全局对象
5. 为普通对象补充 `name`
6. 在模板渲染时临时提供 `parent`
7. 按 `tpl[].files` 搜索模板文件
8. 遍历最终全局对象中带 `match` 的普通对象
9. 用 EJS 渲染匹配到的模板
10. 将结果写入 `tpl[].out`

## 文档导航

项目的正式规格和实现说明都在 `doc/` 下：

1. `doc/spec-vision.md`：整体目标、处理流程、边界和输出规则
2. `doc/spec-config.md`：配置文件结构和路径规则
3. `doc/spec-data-model.md`：入口脚本、`include()`、`remove()`、`replace()`、`update()` 和对象合并语义
4. `doc/spec-templates.md`：模板发现、`match` 规则和输出聚合
5. `doc/spec-rendering.md`：EJS 渲染上下文和 QuickJS 约束
6. `doc/architecture-build.md`：源码模块划分和构建链路
7. `doc/implementation-status.md`：当前实现覆盖情况

## 环境要求

- 已提供 QuickJS 二进制：
  - `bin/qjs-linux-x86_64`
  - `bin/qjs-windows-x86_64.exe`
- 需要本机安装 `esbuild`

如果尚未安装 `esbuild`：

```sh
npm install -g esbuild
```

## 配置格式

最小示例：

```json
{
  "data": "data/root.js",
  "debugDataOut": "debug/global-data.json",
  "debugMatchOut": "debug/match-data.json",
  "tpl": [
    {
      "files": [
        "tpl/*.tpl"
      ],
      "out": "out/generated.txt"
    }
  ]
}
```

字段说明：

- `data`：入口数据脚本，相对于配置文件所在目录
- `debugDataOut`：可选，全局对象调试输出文件；为空或未配置则不输出
- `debugMatchOut`：可选，模板与命中对象调试输出文件；为空或未配置则不输出
- `tpl[].files`：模板文件模式列表，支持 `*`、`?`、`**`
- `tpl[].out`：输出文件路径，相对于配置文件所在目录

调试输出说明：

- `debugDataOut` 输出的是补充 `name` 之前的全局对象 JSON 快照
- `debugMatchOut` 输出的是模板路径和命中对象数据列表
- 模板调试对象默认不写入 `parent`

## 数据脚本约定

数据脚本必须是 ES Module。它既可以通过 `export default` 返回一个对象参与合并，也可以不导出默认对象、只通过脚本副作用直接修改当前全局对象。

示例：

```js
include("sub.js");
include("patch.js");
remove("modules.obsolete");
const detailTitle = get("modules.detail.title");
const secondName = get("lookup.items.1.name");
replace("modules.detail.title", "detail-updated-by-root");
update("meta", {
  extra: "added-by-update",
  detailTitle,
  secondName
});

export default {
  meta: {
    version: "1.0.0"
  },
  modules: {
    match: "main.tpl",
    title: "main-from-root"
  }
};
```

规则摘要：

- `include("sub.js")`：按当前脚本所在目录解析相对路径
- `remove("a.b.c")`：从当前全局对象删除点分路径
- `replace("a.b.c", value)`：直接替换路径上的值，必要时自动创建缺失路径
- `update("a.b.c", patchObject)`：把普通对象补丁深合并到目标对象上，必要时自动创建缺失路径
- `get("a.b.c")`：读取当前全局对象中的值；路径不存在时报错，支持数组下标如 `items.1.name`
- `get()` 返回对象或数组时，可直接修改返回值，从而以副作用方式更新全局对象
- 数据脚本没有 `export default` 时，不会额外合并对象，但脚本副作用仍然生效
- 只有 `enable === true` 且 `match` 命中的对象才会参与模板渲染
- 合并时类型不匹配会报错
- 数组中的对象不会参与模板匹配遍历

## 模板上下文

每次模板渲染时可使用这些变量：

```js
{
  item,
  parent,
  root,
  template,
  output
}
```

示例：

```ejs
<%= item.name %>|<%= parent ? parent.name : "root" %>|<%= root.meta.version %>
```

## 直接运行

使用源码入口运行：

```sh
bin/qjs-linux-x86_64 src/index.js path/to/dtc.json
```

查看版本：

```sh
bin/qjs-linux-x86_64 src/index.js --version
```

使用打包后的 bundle 运行：

```sh
bin/qjs-linux-x86_64 build/bundle.js path/to/dtc.json
```

## 构建

执行：

```sh
./pbuild.sh
```

构建后会生成：

- `build/bundle.js`
- `build/dtc.run`
- `build/dtc.exe`

运行编译后的 Linux 可执行文件：

```sh
build/dtc.run path/to/dtc.json
```

查看编译产物版本：

```sh
build/dtc.run --version
```

## 测试

运行全部测试：

```sh
bin/qjs-linux-x86_64 --module test/test.js
```

当前测试覆盖：

- 基础渲染流程
- 版本号来源
- 调试输出文件
- `include()` / `remove()` / `replace()` / `update()` / `get()`
- 无 `default export` 模块的副作用更新
- `enable === true` 过滤逻辑
- `get()` 读取缺失路径报错
- `name` 与渲染期 `parent`
- 空输出行为
- 通配符模板匹配
- 合并类型冲突
- 循环 `include()`

## 参考文档

更详细的规格和设计说明见 `doc/` 下各文档。
