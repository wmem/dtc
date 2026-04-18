export default {
  alpha: {
    enable: true,
    match: "x*.tpl",
    title: "alpha"
  },
  beta: {
    enable: true,
    match: "*.tpl",
    title: "beta"
  },
  group: {
    nested: {
      enable: true,
      match: "xray.tpl",
      title: "nested"
    },
    disabled: {
      enable: false,
      match: "xray.tpl",
      title: "disabled"
    }
  }
};
