import { run } from "./core/run.js";

function printUsage() {
  const message = "Usage: dtc <config-file>\n";
  if (typeof std !== "undefined" && std.err) {
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

function printError(error) {
  const message = `${error.message}\n`;
  if (typeof std !== "undefined" && std.err) {
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

function getArgs() {
  if (typeof scriptArgs !== "undefined" && Array.isArray(scriptArgs)) {
    const args = scriptArgs.slice();
    if (args.length >= 2) {
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
  if (args.length !== 1) {
    printUsage();
    throw new Error("Invalid arguments.");
  }

  run(args[0]);
} catch (error) {
  printError(error);
  throw error;
}