const whenValidator = require("./internal/whenValidator");

module.exports = function matcherRoute(matcherStore, requestStore) {
  function process(request, matcher, logger) {
    try {
      if (!whenValidator(request, matcher.when)) {
        return;
      }

      logger.info("Routing to matcher", { matcher });

      const response = matcher.respond;
      requestStore.push({ request, matcher, response });

      if (matcher.times > 0) {
        matcher.times--;
      }

      return response;
    } catch (ex) {
      const error = new Error(
        `Critical error occured when trying to parse matcher: ${ex.message}`
      );
      error.cause = ex;
      error.source = matcher;

      throw error;
    }
  }

  return (request, logger) => {
    return matcherStore
      .filter(matcher => matcher.times !== 0)
      .reduce(
        (prev, matcher) => prev || process(request, matcher, logger),
        undefined
      );
  };
};
