include("sub.js");
remove("modules.obsolete");

export default {
  meta: {
    version: "1.0.0"
  },
  modules: {
    enable: true,
    match: "main.tpl",
    title: "main-from-root"
  },
  docs: {
    item: {
      enable: true,
      match: "detail.tpl",
      title: "detail-from-root"
    },
    disabledItem: {
      enable: false,
      match: "detail.tpl",
      title: "should-not-render"
    },
    noEnableItem: {
      match: "detail.tpl",
      title: "should-not-render-too"
    }
  }
};
