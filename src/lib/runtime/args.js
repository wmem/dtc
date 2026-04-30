export function getArgs() {
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