export default {
  alpha: {
    match: "x*.tpl",
    title: "alpha"
  },
  beta: {
    match: "*.tpl",
    title: "beta"
  },
  group: {
    nested: {
      match: "xray.tpl",
      title: "nested"
    }
  }
};
