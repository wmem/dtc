import * as std from "qjs:std";

export function printMessage(message) {
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