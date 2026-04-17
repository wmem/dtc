import ejs from "./ejs/ejs-wrapper.js";
const tpl = "Hello <%= name+'ss' %>";
const result = ejs.render(tpl, { name: "world" });
console.log(result);

// try {
//     const test = await import("./test.js");

//     console.log("module loaded");

//     console.log(test.some_test);
//     console.log(test.default.haha);
// } catch (error) {
//     console.log("Error loading test.js:", error);
// }