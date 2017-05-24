const registerExpectations = require("./expectations/routes");

const healthcheckHandler = require("./healthcheck");
const {
  getAllRequestsHandler,
  getAllMatchersHandler,
  getSingleMatcherHandler,
  createMatcherHandler,
  deleteMatcherHandler,
  resetHandler,
  shutdownHandler
} = require("../shamCore");

module.exports = routeUtils => {
  const { internalRoute, matcherStore, requestStore, server } = routeUtils;

  return [
    ...registerExpectations(routeUtils),
    internalRoute("GET", /^\/\$health$/, healthcheckHandler()),
    internalRoute("GET", /^\/\$matchers$/, getAllMatchersHandler(matcherStore)),
    internalRoute(
      "GET",
      /^\/\$matchers\/(.*)$/,
      getSingleMatcherHandler(matcherStore)
    ),
    internalRoute("POST", /^\/\$matchers$/, createMatcherHandler(matcherStore)),
    internalRoute(
      "DELETE",
      /^\/\$matchers\/(.*)$/,
      deleteMatcherHandler(matcherStore)
    ),
    internalRoute("GET", /^\/\$requests$/, getAllRequestsHandler(requestStore)),
    internalRoute(
      "POST",
      /^\/\$reset$/,
      resetHandler(matcherStore, requestStore)
    ),
    internalRoute("POST", /^\/\$shutdown$/, shutdownHandler(server))
  ];
};
