# 配置文件规格

`dtc` 通过一个 JSON 配置文件启动。当前版本只支持 JSON，不支持注释和尾随逗号。

## 最小示例

```json
{
  "data": "data/root.js",
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

任一校验失败都应立刻报错并停止执行。

## 路径规范化

- 内部实现应将所有配置路径转为绝对路径后再继续处理。
- `out` 的父目录如果不存在，应在写入前自动创建。
- 如果两个不同的 `tpl` 任务解析后指向同一个绝对输出路径，视为配置错误，直接失败。

## 建议的内部结构

配置解析完成后，建议在内存中统一成如下结构：

```js
{
  configFile: "/abs/project/dtc.json",
  configDir: "/abs/project",
  dataEntry: "/abs/project/data/root.js",
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
