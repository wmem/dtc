# EJS 渲染规格

本文档定义 `dtc` 在 QuickJS 环境中的 EJS 使用方式和模板上下文约束。

## 运行前提

当前仓库已经提供：

- `src/lib/ejs/ejs.min.js`
- `src/lib/ejs/ejs-wrapper.js`

当前实现通过 `ejs-wrapper.js` 暴露统一的 `ejs` 对象，不直接在业务代码中依赖浏览器全局变量。

## 渲染入口

每次模板渲染调用统一等价于：

```js
ejs.render(templateContent, renderContext)
```

当前版本不启用自定义文件加载器，也不启用 EJS 的 `include` 模板功能。

## 渲染上下文

当前模板上下文固定为以下结构：

```js
{
  item,
  parent,
  root,
  template,
  output
}
```

### 字段含义

- `item`：当前命中的数据对象。
- `parent`：当前命中对象的父对象，根对象时为 `undefined`。该值只存在于渲染上下文中，不写回 `item` 本身。
- `root`：最终全局对象。
- `template.name`：模板基础文件名。
- `template.path`：模板绝对路径。
- `output.path`：当前输出文件绝对路径。

## 模板编写约定

模板作者应优先使用 `item` 访问当前对象，用 `parent` 访问父对象，用 `root` 访问全局数据。构建完成后的普通对象都应具备可用的 `name` 字段。

示例：

```ejs
/* template: <%= template.name %> */
const name = "<%= item.name %>";
const parentName = "<%= parent ? parent.name : '' %>";
const version = "<%= root.meta.version %>";
```

## 可用能力

模板中允许使用标准 EJS 语法：

- `<%= ... %>`：输出转义结果。
- `<%- ... %>`：输出非转义结果。
- `<% ... %>`：执行逻辑代码。

## 禁止能力

为了保证 QuickJS 下行为稳定，当前版本禁止以下用法：

- 不允许在模板中访问 Node.js API。
- 不允许在模板中假定 `window`、`document`、`fetch` 等浏览器对象存在。
- 不允许在模板中动态读取其他文件。
- 不允许依赖 EJS 的模板 include 链。

## 错误约定

- 任意模板渲染失败都视为任务失败。
- 错误信息中必须包含模板绝对路径。
- 如果能定位到当前命中的数据对象，错误信息中应附带该对象在最终全局对象中的访问路径。

## 性能约定

- 同一个模板文件的源码读取一次即可，不要重复读取。
- 可缓存模板编译结果，但缓存键必须使用模板绝对路径。
- 不要求跨进程缓存。

## QuickJS 兼容性说明

`ejs.min.js` 来自预构建产物，不应要求 Node.js 的 `fs`、`path` 或 `process` 才能完成当前版本的基本渲染。

如果未来需要支持更复杂的 EJS 特性，应先更新本文件，再调整实现。
