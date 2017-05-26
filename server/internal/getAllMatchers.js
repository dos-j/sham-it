module.exports = function getAllMatchersHandler(matcherStore) {
  return () => ({
    status: 200,
    body: matcherStore
  });
};
