export default {
  lookup: {
    items: [
      {
        name: "first-item"
      },
      {
        name: "second-item"
      }
    ]
  },
  modules: {
    obsolete: "remove-me",
    detail: {
      enable: true,
      match: "detail.tpl",
      title: "detail-from-sub"
    }
  },
  ignoredList: [
    {
      match: "list.tpl",
      title: "should-not-render"
    }
  ]
};
