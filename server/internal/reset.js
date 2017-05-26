module.exports = function reset(matcherStore, requestStore) {
  return () => {
    matcherStore.length = 0;
    requestStore.length = 0;

    return { status: 204 };
  };
};
