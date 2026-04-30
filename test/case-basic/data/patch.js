const detail = get("modules.detail");
detail.patchedBySideEffect = "yes";

updateRoot({
  meta: {
    patchedBySideEffect: true
  }
});
