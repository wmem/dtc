// 文件说明：
// 编排 dtc 的完整执行流程：配置解析、数据构建、模板发现、渲染与写盘。
import { loadConfig } from "./config.js";
import { collectMatchedObjects } from "./data-query.js";
import { buildGlobalData } from "./data-loader.js";
import { writeOutputFile } from "./output-writer.js";
import { renderTask } from "./render-task.js";
import { discoverTemplates } from "./template-discovery.js";

// 执行一次完整的 dtc 任务。
export function run(configPath) {
  const config = loadConfig(configPath);
  const rootData = buildGlobalData(config.dataEntry);
  const matchedObjects = collectMatchedObjects(rootData);

  for (const task of config.tasks) {
    const templateFiles = discoverTemplates(config.configDir, task.filePatterns);
    const renderedContent = renderTask(rootData, matchedObjects, templateFiles, task.outputFile);
    writeOutputFile(task.outputFile, renderedContent);
  }
}
