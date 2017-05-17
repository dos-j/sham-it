const registerRoutes = require("./routes");

describe("unit: internal/expectations/routes", () => {
  let routes;
  let utils;

  beforeEach(() => {
    utils = {
      internalRoute(...args) {
        return args;
      },
      requestStore: []
    };

    routes = registerRoutes(utils);
  });

  test("it should return all of the expectation routes", () => {
    expect(routes).toMatchSnapshot();
  });
});
