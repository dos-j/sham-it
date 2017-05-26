module.exports = function deleteMatcher(matcherStore) {
  return id => {
    let index;
    if ((index = matcherStore.findIndex(matcher => matcher.id === id)) >= 0) {
      matcherStore.splice(index, 1);
    }
    return {
      status: 204
    };
  };
};
