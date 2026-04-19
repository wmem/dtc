# 模板发现与匹配规格

本文档定义模板文件的发现方式、`match` 与 `enable` 规则以及输出聚合规则。

## 模板任务模型

配置中的每个 `tpl` 元素表示一个独立的模板任务：

- `files`：模板文件模式列表。
- `out`：该任务唯一的输出文件。

单个模板任务内部可以处理多个模板文件，也可以让多个模板文件共同生成到同一个输出文件。

## 模板文件发现

### 输入

- `files` 中的字符串列表。
- 配置文件所在目录作为路径基准。

### 规则

1. 按 `files` 中的声明顺序逐项展开。
2. 单个模式可匹配零个、一个或多个文件。
3. 每个模式展开后的结果按字典序升序排序。
4. 同一任务内如果多个模式匹配到相同绝对路径模板文件，只保留第一次出现。
5. 如果某个模式没有匹配到任何文件，不报错。
6. 如果整个任务最终没有发现任何模板文件，仍然生成空输出文件。
7. 模板模式匹配应复用公共通配符匹配库，不应在模板层重复实现一套新逻辑。

## `match` 匹配规则

### 候选数据对象

最终全局对象中所有满足以下条件的对象都参与匹配：

- 是普通对象。
- 包含 `match` 字段。
- `match` 是非空字符串。
- 包含 `enable` 字段，且 `enable === true`。
- 数组中的对象元素不参与匹配候选搜索。

### 比较对象

`match` 与模板文件的基础文件名比较，基础文件名包含扩展名。

示例：

- 模板路径 `tpl/abc.tpl` 的比较目标是 `abc.tpl`。
- 模板路径 `tpl/sub/x.y.tpl` 的比较目标是 `x.y.tpl`。

### 匹配语义

只有在 `enable === true` 的前提下，`match` 才会参与模板文件名匹配。`match` 使用类 glob 语义，规则与 `tpl[].files` 一致：

- `*`：匹配任意长度字符。
- `?`：匹配单个字符。

示例：

- `match: "*.tpl"`：匹配所有 `.tpl` 模板。
- `match: "abc.tpl"`：仅匹配 `abc.tpl`。
- `match: "x*.tpl"`：匹配以 `x` 开头的模板文件。

示例：

- `enable: true, match: "detail.tpl"`：参与 `detail.tpl` 渲染。
- `enable: false, match: "detail.tpl"`：即使 `match` 命中，也不参与渲染。
- 缺少 `enable` 字段：不参与渲染。

## 单模板渲染规则

对每个模板文件执行以下流程：

1. 收集所有命中的数据对象。
2. 如果配置了 `debugMatchOut`，记录当前模板文件路径与命中对象数据。
3. 按搜索顺序逐个渲染模板。
4. 每个命中的数据对象独立渲染一次。

如果一个模板文件命中了三个对象，则该模板会被渲染三次。

## 模板调试输出

如果配置了 `debugMatchOut`，建议输出如下结构：

```js
[
  {
    templatePath: "/abs/project/tpl/detail.tpl",
    matchedObjects: [
      {
        name: "detail",
        match: "detail.tpl",
        title: "detail-from-sub"
      }
    ]
  }
]
```

规则：

- `templatePath` 使用模板绝对路径。
- `matchedObjects` 按当前模板的命中顺序输出。
- 输出对象时应避免把 `parent` 写入 JSON，防止循环引用。
- `name` 等普通字段可以保留，便于调试。

## 输出聚合规则

同一个模板任务的渲染结果按以下顺序追加：

1. 模板文件顺序由 `files` 展开结果决定。
2. 每个模板文件内部，按命中对象顺序追加。
3. 每个渲染片段之间插入一个换行符 `\n`。
4. 输出文件结尾不额外补充多余空行。

## 写入行为

- 一个模板任务在内存中先完成全部片段收集，再一次性写入对应 `out` 文件。
- 后执行的模板任务不能覆盖前一个模板任务的 `out`，因为配置层已禁止多个任务指向同一输出文件。

## 模板上下文中的元信息

每次渲染建议提供以下元信息，便于模板使用：

```js
{
  item: matchedObject,
  parent: parentObject,
  root: finalDataObject,
  template: {
    name: "abc.tpl",
    path: "/abs/project/tpl/abc.tpl"
  },
  output: {
    path: "/abs/project/out/generated.c"
  }
}
```

其中：

- `item` 是当前命中的对象。
- `parent` 是当前对象的父对象，如果当前对象就是根对象，则为 `undefined`。
- `root` 是整个最终全局对象。
- `template` 描述当前模板。
- `output` 描述当前输出目标。

## 建议的内部模块

- `src/core/template-discovery.js`：展开模板模式并去重。
- `src/core/template-match.js`：实现 `match` 与模板文件名比较。
- `src/core/render-task.js`：负责单个模板任务的渲染和片段聚合。
- `src/core/output-writer.js`：负责目录创建和最终写文件。
