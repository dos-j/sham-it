const internalRoute = require("./internalRoute");
const matcherRoute = require("./matcherRoute");
const defaultRoute = require("./defaultRoute");

const {
  getAllRequestsHandler,
  getAllMatchersHandler,
  getSingleMatcherHandler,
  createMatcherHandler,
  deleteMatcherHandler,
  resetHandler,
  shutdownHandler
} = require("./shamCore");

const registerInternal = require("./internal/routes");

module.exports = function createRouteStore(
  server,
  matcherStore,
  requestStore,
  defaultReply
) {
  const routeUtils = {
    internalRoute,
    matcherRoute,
    defaultRoute,
    server,
    matcherStore,
    requestStore,
    defaultReply
  };
  return [
    ...registerInternal(routeUtils),
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
    internalRoute("POST", /^\/\$shutdown$/, shutdownHandler(server)),
    matcherRoute(matcherStore, requestStore),
    defaultRoute(defaultReply, requestStore)
  ];
};
