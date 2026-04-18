include("sub.js");
remove("modules.obsolete");

export default {
  meta: {
    version: "1.0.0"
  },
  modules: {
    match: "main.tpl",
    title: "main-from-root"
  },
  docs: {
    item: {
      match: "detail.tpl",
      title: "detail-from-root"
    }
  }
};
