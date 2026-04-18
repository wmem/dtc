# DTC

`dtc` 是一个运行在 QuickJS 上的模板生成工具。它会读取一个 JSON 配置文件，执行入口数据脚本构建最终全局对象，筛选匹配模板的数据对象，再使用 EJS 渲染并输出目标文件。

## 特性

- 纯 JavaScript 实现，运行时为 QuickJS
- 使用 `qjs:std`、`qjs:os` 访问 QuickJS 内建能力
- 支持 `include()` 和 `remove()` 构建全局对象
- 支持模板文件通配符搜索
- 支持对象 `match` 通配符匹配模板文件名
- 自动为普通对象补充 `name` 和 `parent`
- 支持打包为 Linux / Windows 可执行文件

## 目录结构

```text
.
├── bin/                    QuickJS 可执行文件
├── build/                  构建产物
├── doc/                    设计文档与规格文档
├── src/
│   ├── core/               配置解析、数据构建、模板渲染主流程
│   ├── runtime/            文件、路径、glob 等 QuickJS 运行时适配
│   ├── lib/                可复用的公共工具
│   ├── ejs/                EJS 适配层和预构建产物
│   └── index.js            CLI 入口
├── test/
│   ├── case-basic/         基础成功用例
│   ├── case-empty-output/  无匹配输出用例
│   ├── case-type-mismatch/ 合并类型冲突用例
│   ├── case-circular/      循环 include 用例
│   ├── case-wildcard/      通配符匹配用例
│   └── test.js             测试入口
└── pbuild.sh               构建脚本
```

## 核心流程

1. 读取 `dtc.json`
2. 执行 `data` 指定的入口脚本
3. 在执行期间处理 `include()` 和 `remove()`
4. 合并所有默认导出对象，得到最终全局对象
5. 为普通对象补充 `name` / `parent`
6. 按 `tpl[].files` 搜索模板文件
7. 遍历最终全局对象中带 `match` 的普通对象
8. 用 EJS 渲染匹配到的模板
9. 将结果写入 `tpl[].out`

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
- `tpl[].files`：模板文件模式列表，支持 `*`、`?`、`**`
- `tpl[].out`：输出文件路径，相对于配置文件所在目录

## 数据脚本约定

数据脚本必须是 ES Module，并且必须有默认导出对象。

示例：

```js
include("sub.js");
remove("modules.obsolete");

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
- `build/dtc`
- `build/dtc.exe`

运行编译后的 Linux 可执行文件：

```sh
build/dtc path/to/dtc.json
```

## 测试

运行全部测试：

```sh
bin/qjs-linux-x86_64 test/test.js
```

当前测试覆盖：

- 基础渲染流程
- `include()` / `remove()`
- `name` / `parent`
- 空输出行为
- 通配符模板匹配
- 合并类型冲突
- 循环 `include()`

## 参考文档

更详细的规格和设计说明见 `doc/`：

- `doc/spec-vision.md`
- `doc/spec-config.md`
- `doc/spec-data-model.md`
- `doc/spec-templates.md`
- `doc/spec-rendering.md`
- `doc/architecture-build.md`
- `doc/implementation-status.md`
