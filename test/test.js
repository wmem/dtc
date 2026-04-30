import * as std from "qjs:std";
import * as os from "qjs:os";
import { loadConfig } from "../src/app/config/config.js";
import { buildGlobalData } from "../src/app/data/data-loader.js";
import { collectMatchedObjects } from "../src/app/data/data-query.js";
import { run } from "../src/app/cil/run.js";
import { normalizePath } from "../src/lib/runtime/path.js";
import { readTextFile } from "../src/lib/runtime/fs.js";
import { VERSION } from "../src/version.js";

function unwrapOsResult(result, action) {
  if (!Array.isArray(result)) {
    return result;
  }

  const [value, err] = result;
  if (err && err !== 0) {
    throw new Error(`${action} failed: errno ${err}`);
  }
  return value;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(text, expectedPart, message) {
  assert(text.includes(expectedPart), `${message}\n--- actual ---\n${text}`);
}

function expectThrows(fn, expectedPart, message) {
  try {
    fn();
  } catch (error) {
    assertIncludes(String(error.message), expectedPart, message);
    return;
  }

  throw new Error(`${message}\n--- actual ---\n未抛出异常`);
}

function getCwd() {
  return normalizePath(unwrapOsResult(os.getcwd(), "getcwd"));
}

function runVersionCase() {
  assert(typeof VERSION === "string" && VERSION.length > 0, "VERSION 应为非空字符串");
  assert(/^\d+\.\d+\.\d+$/.test(VERSION), "VERSION 应使用 x.y.z 格式");
}

function runBasicCase(projectRoot) {
  const caseDir = `${projectRoot}/test/case-basic`;
  const configPath = `${caseDir}/dtc.json`;
  const outputPath = `${caseDir}/out/generated.txt`;
  const debugDataPath = `${caseDir}/debug/global-data.json`;
  const debugMatchPath = `${caseDir}/debug/match-data.json`;

  const config = loadConfig(configPath);
  const rootData = buildGlobalData(config.dataEntry);
  const matchedObjects = collectMatchedObjects(rootData);

  assert(rootData.name === "root", "根对象 name 应为 root");
  assert(rootData.parent === undefined, "全局对象本身不应注入 parent 字段");
  assert(rootData.modules.name === "modules", "modules.name 应自动补成 modules");
  assert(rootData.modules.parent === undefined, "普通对象本身不应注入 parent 字段");
  assert(rootData.modules.obsolete === undefined, "remove() 应删除 modules.obsolete");
  assert(rootData.modules.detail.title === "detail-updated-by-root", "replace() 应能直接替换已有字段");
  assert(rootData.modules.detail.patchedBySideEffect === "yes", "无 default export 的模块应能直接修改已有对象");
  assert(rootData.meta.extra === "added-by-update", "update() 应能按对象合并并创建缺失路径");
  assert(rootData.meta.detailTitleBeforeUpdate === "detail-from-sub", "get() 应能读取当前全局对象中的已有字段");
  assert(rootData.meta.secondLookupName === "second-item", "get() 应支持读取数组项路径");
  assert(rootData.meta.patchedBySideEffect === true, "无 default export 的模块应能只通过副作用更新全局对象");
  assert(rootData.docs.item.note === "created-before-merge", "update() 应能在默认导出合并前创建对象路径");
  assert(rootData.docs.item.parent === undefined, "子对象本身也不应注入 parent 字段");
  assert(matchedObjects.length === 3, "应只找到 3 个可渲染对象，数组中的对象不能参与遍历");

  run(configPath);

  const rendered = std.loadFile(outputPath);
  const expected = [
    "DETAIL|name=detail|parent=modules|title=detail-updated-by-root|version=1.0.0",
    "DETAIL|name=item|parent=docs|title=detail-from-root|version=1.0.0",
    "MAIN|name=modules|parent=root|title=main-from-root|version=1.0.0"
  ].join("\n");

  assert(rendered === expected, `输出不符合预期。\n--- expected ---\n${expected}\n--- actual ---\n${rendered}`);

  const debugData = JSON.parse(readTextFile(debugDataPath));
  assert(debugData.name === undefined, "全局对象调试输出应在注入 name 前生成");
  assert(debugData.parent === undefined, "全局对象调试输出不应包含 parent");
  assert(debugData.modules.obsolete === undefined, "全局对象调试输出应体现 remove() 的结果");
  assert(debugData.modules.detail.title === "detail-updated-by-root", "全局对象调试输出应体现 replace() 的替换结果");
  assert(debugData.modules.detail.patchedBySideEffect === "yes", "全局对象调试输出应包含无 default export 模块的直接修改");
  assert(debugData.meta.extra === "added-by-update", "全局对象调试输出应体现 update() 的对象合并结果");
  assert(debugData.meta.detailTitleBeforeUpdate === "detail-from-sub", "全局对象调试输出应保留 get() 读取到的对象字段");
  assert(debugData.meta.secondLookupName === "second-item", "全局对象调试输出应保留 get() 读取到的数组项");
  assert(debugData.meta.patchedBySideEffect === true, "全局对象调试输出应包含无 default export 模块的副作用更新");
  assert(debugData.docs.item.note === "created-before-merge", "全局对象调试输出应保留 update() 新建的对象路径");
  assert(debugData.docs.item.title === "detail-from-root", "全局对象调试输出应包含合并后的数据");

  const debugMatch = JSON.parse(readTextFile(debugMatchPath));
  assert(Array.isArray(debugMatch) && debugMatch.length === 2, "模板调试输出应包含 2 个模板记录");
  assert(debugMatch[0].templatePath.endsWith("/detail.tpl"), "第一个模板调试记录应为 detail.tpl");
  assert(debugMatch[0].matchedObjects.length === 2, "detail.tpl 应命中 2 个对象");
  assert(debugMatch[0].matchedObjects[0].parent === undefined, "模板调试输出中的对象不应包含 parent，避免循环引用");
  assert(debugMatch[1].templatePath.endsWith("/main.tpl"), "第二个模板调试记录应为 main.tpl");
  assert(debugMatch[1].matchedObjects.length === 1, "main.tpl 应命中 1 个对象");
  assert(debugMatch[1].matchedObjects[0].name === "modules", "模板调试输出应保留 name 信息");
}

function runEmptyOutputCase(projectRoot) {
  const caseDir = `${projectRoot}/test/case-empty-output`;
  const configPath = `${caseDir}/dtc.json`;
  const outputPath = `${caseDir}/out/generated.txt`;

  run(configPath);

  const rendered = std.loadFile(outputPath);
  assert(rendered === "", "无匹配对象时应生成空文件");
}

function runWildcardCase(projectRoot) {
  const caseDir = `${projectRoot}/test/case-wildcard`;
  const configPath = `${caseDir}/dtc.json`;
  const outputPath = `${caseDir}/out/generated.txt`;

  run(configPath);

  const rendered = readTextFile(outputPath);
  const expected = [
    "XRAY|alpha|alpha",
    "XRAY|beta|beta",
    "XRAY|nested|nested",
    "BASE|beta|beta"
  ].join("\n");

  assert(rendered === expected, `通配符匹配输出不符合预期。\n--- expected ---\n${expected}\n--- actual ---\n${rendered}`);
}

function runEnableFilterCase(projectRoot) {
  const caseDir = `${projectRoot}/test/case-enable-filter`;
  const configPath = `${caseDir}/dtc.json`;
  const outputPath = `${caseDir}/out/generated.txt`;
  const config = loadConfig(configPath);
  const rootData = buildGlobalData(config.dataEntry);
  const matchedObjects = collectMatchedObjects(rootData);

  assert(matchedObjects.length === 1, "只有 enable=true 的对象才应参与模板渲染");

  run(configPath);

  const rendered = readTextFile(outputPath);
  const expected = "ENABLED|enabledItem|render-me";
  assert(rendered === expected, `enable 过滤输出不符合预期。\n--- expected ---\n${expected}\n--- actual ---\n${rendered}`);
}

function runGetMissingCase(projectRoot) {
  const caseDir = `${projectRoot}/test/case-get-missing`;
  const configPath = `${caseDir}/dtc.json`;
  const config = loadConfig(configPath);

  expectThrows(
    () => buildGlobalData(config.dataEntry),
    "get() path does not exist: meta",
    "get() 读取不存在路径时应直接报错"
  );
}

function runTypeMismatchCase(projectRoot) {
  const caseDir = `${projectRoot}/test/case-type-mismatch`;
  const configPath = `${caseDir}/dtc.json`;
  const config = loadConfig(configPath);

  expectThrows(
    () => buildGlobalData(config.dataEntry),
    "对象不匹配，无法合并: conflict",
    "类型不匹配时应报出冲突路径"
  );
}

function runCircularIncludeCase(projectRoot) {
  const caseDir = `${projectRoot}/test/case-circular`;
  const configPath = `${caseDir}/dtc.json`;
  const config = loadConfig(configPath);

  expectThrows(
    () => buildGlobalData(config.dataEntry),
    "Circular include detected",
    "循环 include 时应报错"
  );
}

function main() {
  const projectRoot = getCwd();

  runVersionCase();
  console.log("case-version passed");

  runBasicCase(projectRoot);
  console.log("case-basic passed");

  runEmptyOutputCase(projectRoot);
  console.log("case-empty-output passed");

  runWildcardCase(projectRoot);
  console.log("case-wildcard passed");

  runEnableFilterCase(projectRoot);
  console.log("case-enable-filter passed");

  runGetMissingCase(projectRoot);
  console.log("case-get-missing passed");

  runTypeMismatchCase(projectRoot);
  console.log("case-type-mismatch passed");

  runCircularIncludeCase(projectRoot);
  console.log("case-circular passed");

  console.log("All DTC tests passed.");
}

main();