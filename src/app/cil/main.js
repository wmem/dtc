// 文件说明：
// CLI 入口，负责读取命令行参数、调用主流程并统一处理错误输出。
import * as std from "qjs:std";
import { printMessage } from "../../lib/runtime/print.js";
import { getArgs } from "../../lib/runtime/args.js";
import { printVersion } from "./version.js";
import { run } from "./run.js";

// 输出命令行用法说明。
function printUsage() {
    const message = "Usage: dtc <config-file>\n       dtc --version\n";
    printMessage(message);
}

export function main() {
    try {
        const args = getArgs();

        //show version
        if (args.length === 1 && args[0] === "--version") {
            printVersion();
            std.exit(0);
        }

        //run dtc
        if (args.length !== 1) {
            printUsage();
            printError(new Error("Invalid arguments."));
            std.exit(1);
        }
        run(args[0]);

    //print error
    } catch (error) {
        printMessage(`${error.message}\n`);
        std.exit(1);
    }
}
