// 文件说明：
// 编排 dtc 的完整执行流程：配置解析、数据构建、模板发现、渲染与写盘。
import { writeDebugJson } from "./debug-output.js";
import { loadConfig } from "./config.js";
import { collectMatchedObjects } from "./data-query.js";
import { buildGlobalData } from "./data-loader.js";
import { writeOutputFile } from "./output-writer.js";
import { renderTask } from "./render-task.js";
import { discoverTemplates } from "./template-discovery.js";

// 执行一次完整的 dtc 任务。
export function run(configPath) {
  const config = loadConfig(configPath);
  let rawGlobalData;
  const rootData = buildGlobalData(config.dataEntry, {
    onBeforeMetadata(snapshot) {
      rawGlobalData = snapshot;
    },
  });
  const matchedObjects = collectMatchedObjects(rootData);
  const debugMatchEntries = [];

  if (config.debugDataOut) {
    writeDebugJson(config.debugDataOut, rawGlobalData || {});
  }

  for (const task of config.tasks) {
    const templateFiles = discoverTemplates(config.configDir, task.filePatterns);
    const rendered = renderTask(rootData, matchedObjects, templateFiles, task.outputFile);
    debugMatchEntries.push(...rendered.debugEntries);
    writeOutputFile(task.outputFile, rendered.content);
  }

  if (config.debugMatchOut) {
    writeDebugJson(config.debugMatchOut, debugMatchEntries);
  }
}
