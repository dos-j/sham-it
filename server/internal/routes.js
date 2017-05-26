const registerExpectations = require("./expectations/routes");

const healthcheck = require("./healthcheck");
const getAllRequests = require("./getAllRequests");
const getAllMatchers = require("./getAllMatchers");
const getSingleMatcher = require("./getSingleMatcher");
const createMatcher = require("./createMatcher");
const deleteMatcher = require("./deleteMatcher");
const reset = require("./reset");
const shutdown = require("./shutdown");

module.exports = routeUtils => {
  const { internalRoute, matcherStore, requestStore, server } = routeUtils;

  return [
    ...registerExpectations(routeUtils),
    internalRoute("GET", /^\/\$health$/, healthcheck()),
    internalRoute("GET", /^\/\$matchers$/, getAllMatchers(matcherStore)),
    internalRoute(
      "GET",
      /^\/\$matchers\/(.*)$/,
      getSingleMatcher(matcherStore)
    ),
    internalRoute("POST", /^\/\$matchers$/, createMatcher(matcherStore)),
    internalRoute(
      "DELETE",
      /^\/\$matchers\/(.*)$/,
      deleteMatcher(matcherStore)
    ),
    internalRoute("GET", /^\/\$requests$/, getAllRequests(requestStore)),
    internalRoute("POST", /^\/\$reset$/, reset(matcherStore, requestStore)),
    internalRoute("POST", /^\/\$shutdown$/, shutdown(server))
  ];
};
