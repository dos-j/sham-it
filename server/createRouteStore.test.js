const createRouteStore = require("./createRouteStore");

jest.mock("./internalRoute", () => {
  const internalRoute = jest.fn(() => internalRoute.__route);
  internalRoute.__route = () => "internalRoute";

  return internalRoute;
});
const internalRoute = require("./internalRoute");

jest.mock("./matcherRoute", () => {
  const matcherRoute = jest.fn(() => matcherRoute.__route);
  matcherRoute.__route = () => "matcherRoute";

  return matcherRoute;
});
const matcherRoute = require("./matcherRoute");

jest.mock("./defaultRoute", () => {
  const defaultRoute = jest.fn(() => defaultRoute.__route);
  defaultRoute.__route = () => "defaultRoute";

  return defaultRoute;
});
const defaultRoute = require("./defaultRoute");

jest.mock("./internal/routes", () => {
  const register = jest.fn(() => register.__routes);
  register.__routes = ["a", "b", "c"];

  return register;
});
const registerInternal = require("./internal/routes");

describe("unit: createRouteStore", () => {
  let server;
  let matcherStore;
  let requestStore;
  let defaultReply;
  let routeStore;
  beforeEach(() => {
    internalRoute.mockClear();
    matcherRoute.mockClear();
    defaultRoute.mockClear();

    server = { close() {} };

    matcherStore = [() => false];

    requestStore = [{ request: {}, response: {} }];

    defaultReply = { status: 404, body: "Not Found" };

    routeStore = createRouteStore(
      server,
      matcherStore,
      requestStore,
      defaultReply
    );
  });

  test("it should create a single defaultRoute", () => {
    expect(defaultRoute).toHaveBeenCalledTimes(1);
  });

  test("it should create the default route with the defaultReply and requestStore", () => {
    expect(defaultRoute).toHaveBeenCalledWith(defaultReply, requestStore);
  });

  test("it should put the defaultRoute as the last route", () => {
    expect(routeStore.indexOf(defaultRoute.__route)).toBe(
      routeStore.length - 1
    );
  });

  test("it should create a single matcherRoute", () => {
    expect(matcherRoute).toHaveBeenCalledTimes(1);
  });

  test("it should create the matcherRoute with the defaultReply and requestStore", () => {
    expect(matcherRoute).toHaveBeenCalledWith(matcherStore, requestStore);
  });

  test("it should put the matcherRoute as the last route", () => {
    expect(routeStore.indexOf(matcherRoute.__route)).toBe(
      routeStore.length - 2
    );
  });

  test("it should registerInternal routes", () => {
    expect(registerInternal).toHaveBeenCalledWith({
      internalRoute,
      matcherRoute,
      defaultRoute,
      server,
      matcherStore,
      requestStore,
      defaultReply
    });
  });
});
