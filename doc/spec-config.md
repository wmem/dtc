# 配置文件规格

`dtc` 通过一个 JSON 配置文件启动。当前版本只支持 JSON，不支持注释和尾随逗号。

## 最小示例

```json
{
  "data": "data/root.js",
  "debugDataOut": "debug/global-data.json",
  "debugMatchOut": "debug/match-data.json",
  "ejs": {
    "openDelimiter": "[",
    "closeDelimiter": "]"
  },
  "tpl": [
    {
      "files": [
        "tpl/*.tpl",
        "tpl/common/header.tpl"
      ],
      "out": "out/generated.c"
    }
  ]
}
```

## 字段定义

### `data`

- 类型：`string`
- 必填：是
- 含义：入口数据脚本路径。
- 解析基准：相对于配置文件所在目录。

### `tpl`

- 类型：`array`
- 必填：是
- 含义：模板输出任务列表。
- 约束：至少包含一个元素。

### `debugDataOut`

- 类型：`string`
- 必填：否
- 含义：最终全局对象的调试输出文件路径。
- 解析基准：相对于配置文件所在目录。
- 规则：
  - 未配置、`null` 或空字符串时，不输出。
  - 输出内容为 JSON。
  - 必须在注入 `name` 之前输出。

### `debugMatchOut`

- 类型：`string`
- 必填：否
- 含义：模板文件与命中对象信息的调试输出文件路径。
- 解析基准：相对于配置文件所在目录。
- 规则：
  - 未配置、`null` 或空字符串时，不输出。
  - 输出内容为 JSON。
  - 每条记录至少包含模板文件路径和命中的对象数据列表。

### `ejs`

- 类型：`object`
- 必填：否
- 含义：控制 EJS 模板语法的可选渲染配置。

### `ejs.openDelimiter`

- 类型：`string`
- 必填：否
- 含义：EJS 左侧分隔符的外层字符。
- 约束：
  - 只能是单个字符。
  - 未配置时使用 EJS 默认值 `<`。

### `ejs.closeDelimiter`

- 类型：`string`
- 必填：否
- 含义：EJS 右侧分隔符的外层字符。
- 约束：
  - 只能是单个字符。
  - 未配置时使用 EJS 默认值 `>`。

### `tpl[].files`

- 类型：`array<string>`
- 必填：是
- 含义：模板文件匹配模式列表。
- 解析基准：相对于配置文件所在目录。
- 约束：
  - 至少包含一个模式。
  - 支持通配符。
  - 模式可以同时包含单文件路径和带通配符的路径。

### `tpl[].out`

- 类型：`string`
- 必填：是
- 含义：当前模板任务的输出文件路径。
- 解析基准：相对于配置文件所在目录。

## 通配符语义

`tpl[].files` 使用类 glob 语义：

- `*`：匹配单个路径段中的任意字符，不跨目录分隔符。
- `?`：匹配单个字符，不跨目录分隔符。
- `**`：匹配零个或多个路径段。

示例：

- `tpl/*.tpl`：匹配 `tpl` 目录下所有 `.tpl` 文件。
- `tpl/**/x*.tpl`：匹配 `tpl` 目录下任意层级、文件名以 `x` 开头的 `.tpl` 文件。

## 校验规则

配置读取后必须按以下顺序校验：

1. 根节点必须是对象。
2. `data` 必须是非空字符串。
3. `tpl` 必须是非空数组。
4. 每个 `tpl` 元素必须是对象。
5. 每个 `tpl.files` 必须是非空字符串数组。
6. 每个 `tpl.out` 必须是非空字符串。
7. `debugDataOut` 和 `debugMatchOut` 如果配置，必须是字符串或空字符串。
8. `ejs` 如果配置，必须是对象。
9. `ejs.openDelimiter` 和 `ejs.closeDelimiter` 如果配置，必须是单字符字符串。

任一校验失败都应立刻报错并停止执行。

## 路径规范化

- 内部实现应将所有配置路径转为绝对路径后再继续处理。
- Linux 下以 `/` 开头的路径视为绝对路径。
- Windows 下以盘符开头的路径，例如 `C:\\work\\dtc.json` 或 `C:/work/dtc.json`，以及 UNC 路径，例如 `\\\\server\\share\\dtc.json`，都视为绝对路径。
- 配置中允许同时出现 `/` 与 `\\` 作为分隔符，但内部必须归一化后再比较和存储。
- 路径比较必须使用统一的规范化结果，不能直接用原始字符串比较。
- `out` 的父目录如果不存在，应在写入前自动创建。
- `debugDataOut` 和 `debugMatchOut` 的父目录如果不存在，也应在写入前自动创建。
- 如果两个不同的 `tpl` 任务解析后指向同一个绝对输出路径，视为配置错误，直接失败。

## 模式匹配实现约束

- `tpl[].files` 的通配符匹配逻辑应由公共库统一实现。
- 后续如果 `match` 规则与 `files` 规则共享同一套通配符语义，应通过 `import` 复用同一个匹配模块，而不是复制实现。

## 当前内部结构

当前实现中，配置解析完成后会在内存中统一成如下结构：

```js
{
  configFile: "/abs/project/dtc.json",
  configDir: "/abs/project",
  dataEntry: "/abs/project/data/root.js",
  debugDataOut: "/abs/project/debug/global-data.json",
  debugMatchOut: "/abs/project/debug/match-data.json",
  ejsOptions: {
    openDelimiter: "[",
    closeDelimiter: "]"
  },
  tasks: [
    {
      filePatterns: ["tpl/*.tpl", "tpl/common/header.tpl"],
      outputFile: "/abs/project/out/generated.c"
    }
  ]
}
```

## 未来可扩展字段

当前版本不实现，但未来允许在不破坏现有字段的前提下扩展：

- `encoding`
- `separator`
- `strict`
- `helpers`
