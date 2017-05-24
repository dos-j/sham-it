const internalRoute = require("./internalRoute");
const matcherRoute = require("./matcherRoute");
const defaultRoute = require("./defaultRoute");
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
    matcherRoute(matcherStore, requestStore),
    defaultRoute(defaultReply, requestStore)
  ];
};
