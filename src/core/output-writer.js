// 文件说明：
// 负责确保输出目录存在，并把最终渲染结果写入文件。
import { ensureParentDirectory, writeTextFile } from "../runtime/fs.js";

// 写入单个输出文件，必要时自动创建父目录。
export function writeOutputFile(outputPath, content) {
  ensureParentDirectory(outputPath);
  writeTextFile(outputPath, content);
}
