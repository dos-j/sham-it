const matcherRoute = require("./matcherRoute");
const logger = require("../test/logger");

jest.mock("./internal/whenValidator", () =>
  jest.fn((request, when) => when.value)
);
const whenValidator = require("./internal/whenValidator");

describe("unit: matcherRoute", () => {
  let matcherStore;
  let requestStore;
  let route;
  let matcherA;
  let matcherB;
  let matcherC;
  let request;

  beforeEach(() => {
    whenValidator.mockClear();

    request = { pathname: "/test" };

    matcherStore = [
      (matcherA = { when: { a: 1, value: false }, respond: {} }),
      (matcherB = { when: { b: 2, value: true }, respond: { a: 1 } }),
      (matcherC = { when: { c: 3, value: false }, respond: {} })
    ];

    requestStore = [];

    route = matcherRoute(matcherStore, requestStore);
  });

  test("it should return undefined if whenValidator never returns true", () => {
    matcherB.when = false;

    expect(route(request, logger)).toBeUndefined();
  });

  test("it should return the respond object for the first matcher which validates", () => {
    expect(route(request, logger)).toBe(matcherB.respond);
  });

  test("it should stop checking matchers when one validates", () => {
    route(request, logger);

    expect(whenValidator).toHaveBeenCalledWith(request, matcherA.when);
    expect(whenValidator).toHaveBeenCalledWith(request, matcherB.when);
    expect(whenValidator).not.toHaveBeenCalledWith(request, matcherC.when);
  });

  test("it should add the request to the requestStore", () => {
    route(request, logger);

    expect(requestStore).toContainEqual({
      request,
      matcher: matcherB,
      response: matcherB.respond
    });
  });

  test("it should add the cause and source to any errors", () => {
    const cause = new Error("test");
    whenValidator.mockImplementationOnce(() => {
      throw cause;
    });

    let error;
    try {
      route(request, logger);
    } catch (ex) {
      error = ex;
    }

    expect(error).toBeDefined();
    expect(error.cause).toBe(cause);
    expect(error.source).toBe(matcherA);
    expect(error.message).toContain(cause.message);
  });

  test("it should not match a matcher that has expired", () => {
    matcherB.times = 0;

    expect(route(request, logger)).toBeUndefined();
  });

  test("it should decrement the times property when a matcher matches and the times property exists", () => {
    matcherB.times = 2;

    expect(route(request, logger)).toBe(matcherB.respond);

    expect(matcherB).toHaveProperty("times", 1);
  });

  test("it should not decrement the times property if the times propery doesn't exist", () => {
    expect(route(request, logger)).toBe(matcherB.respond);

    expect(matcherB).not.toHaveProperty("times");
  });
});
