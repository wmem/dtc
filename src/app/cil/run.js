// 文件说明：
// 编排 dtc 的完整执行流程：配置解析、数据构建、模板发现、渲染与写盘。
import { writeDebugJson } from "../debug/debug-output.js";
import { loadConfig } from "../config/config.js";
import { collectMatchedObjects } from "../data/data-query.js";
import { buildGlobalData } from "../data/data-loader.js";
import { writeOutputFile } from "../template/output-writer.js";
import { renderTask } from "../template/render-task.js";
import { discoverTemplates } from "../template/template-discovery.js";

// 执行一次完整的 dtc 任务。
export function run(configPath) {

    //load config
    const config = loadConfig(configPath);

    //build global data
    let rawGlobalData;
    const rootData = buildGlobalData(config.dataEntry,
        {
            onBeforeMetadata(snapshot) {
                rawGlobalData = snapshot;
            },
        }
    );

    //Get matched objects
    const matchedObjects = collectMatchedObjects(rootData);
    const debugMatchEntries = [];

    //Write debug data
    if (config.debugDataOut) {
        writeDebugJson(config.debugDataOut, rawGlobalData || {});
    }

    //render templates
    for (const task of config.tasks) {
        const templateFiles = discoverTemplates(config.configDir, task.filePatterns);
        const rendered = renderTask(rootData, matchedObjects, templateFiles, task.outputFile);
        debugMatchEntries.push(...rendered.debugEntries);
        writeOutputFile(task.outputFile, rendered.content);
    }

    //output debug match data
    if (config.debugMatchOut) {
        writeDebugJson(config.debugMatchOut, debugMatchEntries);
    }
}
