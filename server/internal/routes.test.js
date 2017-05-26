const registerRoutes = require("./routes");

jest.mock("./expectations/routes", () => {
  const register = jest.fn(() => register.__routes);
  register.__routes = ["a", "b", "c"];

  return register;
});
const registerExpectations = require("./expectations/routes");

jest.mock("./healthcheck", () => () => "healthcheck");
jest.mock("./getAllRequests", () => () => "getAllRequests");
jest.mock("./getAllMatchers", () => () => "getAllMatchers");
jest.mock("./getSingleMatcher", () => () => "getSingleMatcher");
jest.mock("./createMatcher", () => () => "createMatcher");
jest.mock("./deleteMatcher", () => () => "deleteMatcher");
jest.mock("./reset", () => () => "reset");
jest.mock("./shutdown", () => () => "shutdown");

describe("unit: internal/routes", () => {
  let routes;
  let utils;

  beforeEach(() => {
    utils = {
      internalRoute: jest.fn(
        (method, regex, handler) => `${method} - ${regex} - ${handler}`
      ),
      matcherStore: [],
      requestStore: [],
      server: { shutdown() {} }
    };

    routes = registerRoutes(utils);
  });

  test("it should register the expectation routes", () => {
    expect(registerExpectations).toHaveBeenCalledWith(utils);
  });

  test("it should return all of the internal routes", () => {
    expect(routes).toMatchSnapshot();
  });
});
