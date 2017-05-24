const internalRoute = require("./internalRoute");
const logger = require("../test/logger");

describe("unit: internalRoute", () => {
  let method;
  let regex;
  let handler;
  let route;
  let response;

  beforeEach(() => {
    method = "DELETE";
    regex = /^\/\$matchers\/(.*)$/;
    handler = jest.fn(() => response);
    response = {
      status: 200,
      body: { a: 1 }
    };

    route = internalRoute(method, regex, handler);
  });

  test("it should return undefined if the method does not match", () => {
    expect(route({ method: "GET" }, logger)).toBeUndefined();
  });

  test("it should return undefined if the pathname does not match the regex", () => {
    expect(
      route({ method: "DELETE", pathname: "/bob" }, logger)
    ).toBeUndefined();
  });

  test("it should call the handler if the route matches", () => {
    route({ method: "DELETE", pathname: "/$matchers/1234" }, logger);

    expect(handler).toHaveBeenCalled();
  });

  test("it should call the handler with the url parameters and the body", () => {
    route(
      { method: "DELETE", pathname: "/$matchers/1234", body: "body" },
      logger
    );

    expect(handler).toHaveBeenCalledWith("1234", "body");
  });

  test("it should return the response from the handler", () => {
    expect(
      route({ method: "DELETE", pathname: "/$matchers/1234" }, logger)
    ).toBe(response);
  });
});
