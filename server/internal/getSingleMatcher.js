module.exports = function getSingleMatcher(matcherStore) {
  return id => {
    let matcher;
    if ((matcher = matcherStore.find(matcher => matcher.id === id))) {
      return {
        status: 200,
        body: matcher
      };
    }
    return {
      status: 404,
      body: "Not Found"
    };
  };
};
