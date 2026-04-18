// 文件说明：
// CLI 入口，负责读取命令行参数、调用主流程并统一处理错误输出。
import * as std from "qjs:std";
import { run } from "./core/run.js";
import { VERSION } from "./version.js";

// 输出命令行用法说明。
function printUsage() {
  const message = "Usage: dtc <config-file>\n       dtc --version\n";
  if (std.err) {
    std.err.puts(message);
    return;
  }
  if (typeof console !== "undefined" && typeof console.log === "function") {
    console.log(message.trim());
    return;
  }
  if (typeof print === "function") {
    print(message.trim());
  }
}

// 输出当前 dtc 版本号。
function printVersion() {
  std.out.puts(`dtc ${VERSION}\n`);
}

// 输出错误信息，优先写到标准错误。
function printError(error) {
  const message = `${error.message}\n`;
  if (std.err) {
    std.err.puts(message);
    return;
  }
  if (typeof console !== "undefined" && typeof console.log === "function") {
    console.log(error.message);
    return;
  }
  if (typeof print === "function") {
    print(error.message);
  }
}

// 兼容 QuickJS 直接执行脚本和编译后二进制两种参数形式。
function getArgs() {
  if (typeof scriptArgs !== "undefined" && Array.isArray(scriptArgs)) {
    const args = scriptArgs.slice();
    if (args.length >= 1) {
      const first = String(args[0]);
      if (first.endsWith(".js") || first.endsWith(".mjs")) {
        return args.slice(1);
      }
    }
    return args;
  }
  return [];
}

try {
  const args = getArgs();
  if (args.length === 1 && args[0] === "--version") {
    printVersion();
    std.exit(0);
  }

  if (args.length !== 1) {
    printUsage();
    printError(new Error("Invalid arguments."));
    std.exit(1);
  }

  run(args[0]);
} catch (error) {
  printError(error);
  std.exit(1);
}