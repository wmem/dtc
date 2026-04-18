// 文件说明：
// 执行单个模板任务，把匹配对象渲染成字符串片段并拼接为最终输出。
import ejs from "../ejs/ejs-wrapper.js";
import { basename } from "../runtime/path.js";
import { readTextFile } from "../runtime/fs.js";
import { matchesTemplate } from "./template-match.js";

// 渲染一个模板任务，返回最终应写入输出文件的文本内容。
export function renderTask(rootData, matchedObjects, templateFiles, outputFile) {
  const fragments = [];

  for (const templatePath of templateFiles) {
    const templateName = basename(templatePath);
    const templateContent = readTextFile(templatePath);
    const matchedItems = matchedObjects.filter((item) => matchesTemplate(item, templateName));

    for (const item of matchedItems) {
      try {
        const rendered = ejs.render(templateContent, {
          item,
          parent: item.parent,
          root: rootData,
          template: {
            name: templateName,
            path: templatePath,
          },
          output: {
            path: outputFile,
          },
        });
        // 统一裁掉模板尾部空行，避免多个片段拼接后出现额外空白。
        fragments.push(rendered.replace(/(?:\r?\n)+$/g, ""));
      } catch (error) {
        throw new Error(`Template render failed for ${templatePath}: ${error.message}`);
      }
    }
  }

  return fragments.join("\n");
}
