// 文件说明：
// 负责判断某个数据对象的 match 规则是否命中模板文件名。
import { matchSegment } from "../lib/pattern.js";

// 判断单个对象是否应参与当前模板文件的渲染。
export function matchesTemplate(item, templateName) {
  return typeof item.match === "string" && item.match.length > 0 && matchSegment(templateName, item.match);
}
