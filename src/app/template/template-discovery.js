// 文件说明：
// 根据配置中的 files 模式展开模板文件列表，并做稳定去重。
import { expandGlob } from "../../lib/runtime/glob.js";
import { toComparablePath } from "../../lib/runtime/path.js";

// 发现单个模板任务下需要参与渲染的全部模板文件。
export function discoverTemplates(configDir, filePatterns) {
    const files = [];
    const seen = new Set();

    for (const pattern of filePatterns) {
        const expanded = expandGlob(configDir, pattern);
        for (const file of expanded) {
            const comparable = toComparablePath(file);
            if (seen.has(comparable)) {
                continue;
            }
            seen.add(comparable);
            files.push(file);
        }
    }

    return files;
}
