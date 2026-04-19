// 文件说明：
// 负责判断某个数据对象是否满足模板渲染条件，并校验 match 是否命中模板文件名。
import { matchSegment } from "../lib/pattern.js";

// 判断单个对象是否应参与当前模板文件的渲染。
export function matchesTemplate(entry, templateName) {
  const item = entry.item;
  return item.enable === true && typeof item.match === "string" && item.match.length > 0 && matchSegment(templateName, item.match);
}
