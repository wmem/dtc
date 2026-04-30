// ejs-wrapper.js
globalThis.window = globalThis;
globalThis.global = globalThis;
globalThis.self = globalThis;

await import("./ejs.min.js");

export default globalThis.ejs;