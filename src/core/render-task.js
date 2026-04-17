import ejs from "../ejs/ejs-wrapper.js";
import { basename } from "../runtime/path.js";
import { readTextFile } from "../runtime/fs.js";
import { matchesTemplate } from "./template-match.js";

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
        fragments.push(rendered.replace(/(?:\r?\n)+$/g, ""));
      } catch (error) {
        throw new Error(`Template render failed for ${templatePath}: ${error.message}`);
      }
    }
  }

  return fragments.join("\n");
}
