// 文件说明：
// 读取并校验 dtc 配置文件，同时把关键路径规范化为绝对路径。
import { readTextFile } from "../runtime/fs.js";
import {
  dirname,
  getCurrentWorkingDirectory,
  resolvePath,
  toComparablePath,
} from "../runtime/path.js";

// 简单断言工具，用于集中生成配置校验错误。
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// 判断配置字段是否为非空字符串。
function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

// 加载配置文件并转换为内部统一使用的结构。
export function loadConfig(configArg) {
  assert(isNonEmptyString(configArg), "Missing config file path.");

  const cwd = getCurrentWorkingDirectory();
  const configFile = resolvePath(cwd, configArg);
  const configDir = dirname(configFile);
  const source = readTextFile(configFile);

  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    throw new Error(`Invalid JSON in config file ${configFile}: ${error.message}`);
  }

  assert(parsed && typeof parsed === "object" && !Array.isArray(parsed), "Config root must be an object.");
  assert(isNonEmptyString(parsed.data), "Config field 'data' must be a non-empty string.");
  assert(Array.isArray(parsed.tpl) && parsed.tpl.length > 0, "Config field 'tpl' must be a non-empty array.");

  // 用规范化后的输出路径做去重，避免同一文件被重复写入。
  const outputSet = new Set();
  const tasks = parsed.tpl.map((item, index) => {
    assert(item && typeof item === "object" && !Array.isArray(item), `tpl[${index}] must be an object.`);
    assert(Array.isArray(item.files) && item.files.length > 0, `tpl[${index}].files must be a non-empty array.`);
    assert(isNonEmptyString(item.out), `tpl[${index}].out must be a non-empty string.`);

    const filePatterns = item.files.map((pattern, patternIndex) => {
      assert(isNonEmptyString(pattern), `tpl[${index}].files[${patternIndex}] must be a non-empty string.`);
      return pattern;
    });

    const outputFile = resolvePath(configDir, item.out);
    const comparableOutput = toComparablePath(outputFile);
    if (outputSet.has(comparableOutput)) {
      throw new Error(`Duplicate output file is not allowed: ${outputFile}`);
    }
    outputSet.add(comparableOutput);

    return {
      filePatterns,
      outputFile,
    };
  });

  return {
    configFile,
    configDir,
    dataEntry: resolvePath(configDir, parsed.data),
    tasks,
  };
}
