const defaultRoute = require("./defaultRoute");
const logger = require("../test/logger");

describe("unit: defaultRoute", () => {
  let request;
  let requestStore;

  beforeEach(() => {
    request = { method: "GET" };
    requestStore = [];
  });

  test("it should return the defaultReply", () => {
    const defaultReply = { status: 400, body: "Bad Request" };
    const route = defaultRoute(defaultReply, requestStore);

    expect(route(request, logger)).toBe(defaultReply);
  });

  test("it should return 404 Not Found if there is no defaultReply", () => {
    const route = defaultRoute(undefined, requestStore);

    expect(route(request, logger)).toEqual({ status: 404, body: "Not Found" });
  });

  test("it should add the request to the requestStore", () => {
    const route = defaultRoute(undefined, requestStore);

    route(request, logger);

    expect(requestStore).toEqual([
      {
        request,
        response: { status: 404, body: "Not Found" }
      }
    ]);
  });

  test("it should add the request to the requestStore with the defaultReply", () => {
    const defaultReply = { status: 400, body: "Bad Request" };
    const route = defaultRoute(defaultReply, requestStore);

    route(request, logger);

    expect(requestStore).toEqual([
      {
        request,
        response: defaultReply
      }
    ]);
  });
});
