import { matchSegment } from "../lib/pattern.js";

export function matchesTemplate(item, templateName) {
  return typeof item.match === "string" && item.match.length > 0 && matchSegment(templateName, item.match);
}
