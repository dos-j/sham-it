const registerRoutes = require("./routes");

jest.mock("./expectations/routes", () => {
  const register = jest.fn(() => register.__routes);
  register.__routes = ["a", "b", "c"];

  return register;
});
const registerExpectations = require("./expectations/routes");

describe("unit: internal/routes", () => {
  let routes;
  let utils;

  beforeEach(() => {
    utils = { internalRoute() {} };

    routes = registerRoutes(utils);
  });

  test("it should register the expectation routes", () => {
    expect(registerExpectations).toHaveBeenCalledWith(utils);
  });

  test("it should return all of the internal routes", () => {
    expect(routes).toEqual([...registerExpectations.__routes]);
  });
});
