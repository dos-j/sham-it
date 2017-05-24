const shamBuilder = require("./shamBuilder");
const logger = require("../test/logger");

jest.mock("./reply", () => {
  return jest.fn();
});
const reply = require("./reply");

jest.mock("./requestParser", () => {
  const requestParser = jest.fn(() => Promise.resolve(requestParser.__request));
  requestParser.__request = {
    pathname: "/test",
    headers: { "Content-Type": "application/json" },
    method: "POST",
    body: { a: 1 }
  };

  return requestParser;
});
const requestParser = require("./requestParser");

jest.mock("./createRouteStore", () => {
  const createRouteStore = jest.fn(() => createRouteStore.__routeStore);
  createRouteStore.__routeStore = [
    jest.fn(),
    jest.fn(() => createRouteStore.__response),
    jest.fn()
  ];
  createRouteStore.__response = {
    status: 200,
    body: { b: 2 }
  };

  return createRouteStore;
});
const createRouteStore = require("./createRouteStore");

describe("unit: shamBuilder", () => {
  let req;
  let res;
  let sham;
  let server;
  let defaultReply;
  beforeEach(() => {
    reply.mockClear();
    requestParser.mockClear();
    createRouteStore.mockClear();
    createRouteStore.__routeStore.forEach(route => route.mockClear());

    req = { uri: "http://sham/" };
    res = { writeHead() {}, end() {} };

    server = { close() {} };

    defaultReply = {
      status: 404,
      body: "Not Found"
    };

    sham = shamBuilder(server, defaultReply, logger);
  });

  describe("Constructing the sham", () => {
    test("it should create a route store", () => {
      expect(createRouteStore).toHaveBeenCalledWith(
        server,
        [],
        [],
        defaultReply
      );
    });
  });

  describe("Processing a request", () => {
    test("it should parse the request", async () => {
      await sham(req, res);

      expect(requestParser).toHaveBeenCalledWith(req);
    });

    test("it should call each route sequentially until a route is found", async () => {
      await sham(req, res);

      expect(createRouteStore.__routeStore[0]).toHaveBeenCalledWith(
        requestParser.__request,
        logger
      );
      expect(createRouteStore.__routeStore[1]).toHaveBeenCalledWith(
        requestParser.__request,
        logger
      );
      expect(createRouteStore.__routeStore[2]).not.toHaveBeenCalled();
    });

    test("it should reply with the response from the matched route", async () => {
      await sham(req, res);

      expect(reply).toHaveBeenCalledWith(res, createRouteStore.__response);
    });

    describe("Error handling", () => {
      let error;

      beforeEach(async () => {
        error = new Error("test");
        createRouteStore.__routeStore[1].mockImplementationOnce(() => {
          throw error;
        });

        await sham(req, res);
      });

      test("it should log the error", () => {
        expect(logger.error).toHaveBeenCalledWith("Critical error", { error });
      });

      test("it should reply with an Internal Server Error if one of the routes throws an error", async () => {
        expect(reply).toHaveBeenCalledWith(res, {
          status: 500,
          body: "Internal Server Error"
        });
      });
    });
  });
});
