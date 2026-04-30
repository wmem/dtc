import { VERSION } from "../../version.js";

// 输出当前 dtc 版本号。
export function printVersion() {
    std.out.puts(`dtc ${VERSION}\n`);
}
