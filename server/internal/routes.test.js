const registerRoutes = require("./routes");

jest.mock("./expectations/routes", () => {
  const register = jest.fn(() => register.__routes);
  register.__routes = ["a", "b", "c"];

  return register;
});
const registerExpectations = require("./expectations/routes");

jest.mock("./healthcheck", () => () => "healthcheck");
jest.mock("../shamCore", () => {
  const shamCore = {
    getAllRequestsHandler: jest.fn(() => "getAllRequestsHandler"),
    getAllMatchersHandler: jest.fn(() => "getAllMatchersHandler"),
    getSingleMatcherHandler: jest.fn(() => "getSingleMatcherHandler"),
    createMatcherHandler: jest.fn(() => "createMatcherHandler"),
    deleteMatcherHandler: jest.fn(() => "deleteMatcherHandler"),
    resetHandler: jest.fn(() => "resetHandler"),
    shutdownHandler: jest.fn(() => "shutdownHandler")
  };
  return shamCore;
});
const shamCore = require("../shamCore");

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

    Object.entries(shamCore).forEach(([, func]) => func.mockClear());

    routes = registerRoutes(utils);
  });

  test("it should register the expectation routes", () => {
    expect(registerExpectations).toHaveBeenCalledWith(utils);
  });

  test("it should return all of the internal routes", () => {
    expect(routes).toMatchSnapshot();
  });
});
