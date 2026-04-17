我准备要实现一个模板生成代码的工具"dtc": data-template-compile。
程序的流程为：
- 读取配置文件，获取入口js文件，获取模板配置信息
- 从入口js文件开始运行，合并所有js文件的对象数据，创建一个最后的对象数据
- 搜索模板配置信息中的模板文件，读取所有模板文件的信息：文件内容和文件名称
- 处理所有模板文件，取对象数据中搜索含有match属性，且match和文件名匹配的所有对象数据，渲染到模板中
- 考虑可能多个模板会生成到一个文件中

## 对象构建
工具从入口js文件执行，最终得到一个对象数据。
每个js文件的默认导出是一个对象，可以通过include()和remove修改全局对象，这两个函数实现在全局，
使用include()时,如果是相对路径，以当前js文件为相对路径

```js
//sub.js
const myData = {
    test: {
        test1: 2,
        test2: {
            test3: "kkk"
        }
    }
}
export default myData;
```

```js
//root.js

//将sub.js的对象合并到全局对象中
include("sub.js")

//从全局对象中移除test.test1元素(如果有)
remove("test.test1")

const myData = {
    test: {
        test2: {
            test3: "45555"
        }
    }
}
export default myData;
```

## 配置文件格式参考
```json
{
    "data": "xxx.js",
    "tpl": [
        {
            "files": [
                "xxx/yy*.tpl",
                "xxx/some.tpl",
            ],
            "out": "out1.c"
        },
        {
            "files": [
                "111/222*.tpl",
                "333/4.tpl",
            ],
            "out": "out2.c"
        }
    ]
}
```

## 模板渲染ejs

