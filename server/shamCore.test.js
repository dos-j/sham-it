const shamCore = require("./shamCore");

jest.mock("shortid", () => {
  const shortid = {
    generate: jest.fn(() => shortid.__id),
    __id: "Xe2ds3"
  };

  return shortid;
});
const shortid = require("shortid");

describe("unit: shamCore", () => {
  let handler;
  let matcherStore;
  let requestStore;

  describe("getAllRequestsHandler", () => {
    beforeEach(() => {
      requestStore = [{}, {}, {}];

      handler = shamCore.getAllRequestsHandler(requestStore);
    });

    test("it should return all matchers", () => {
      expect(handler()).toHaveProperty("body", requestStore);
    });

    test("it should return a status of 200", () => {
      expect(handler()).toHaveProperty("status", 200);
    });
  });

  describe("getAllMatchersHandler", () => {
    beforeEach(() => {
      matcherStore = [{}, {}, {}];

      handler = shamCore.getAllMatchersHandler(matcherStore);
    });

    test("it should return all matchers", () => {
      expect(handler()).toHaveProperty("body", matcherStore);
    });

    test("it should return a status of 200", () => {
      expect(handler()).toHaveProperty("status", 200);
    });
  });

  describe("getSingleMatcherHandler", () => {
    beforeEach(() => {
      matcherStore = [
        {
          id: "1"
        },
        {
          id: "2"
        },
        {
          id: "3"
        }
      ];

      handler = shamCore.getSingleMatcherHandler(matcherStore);
    });

    test("it should return the specified matcher", () => {
      expect(handler("2")).toHaveProperty("body", matcherStore[1]);
    });

    test("it should return a status of 200", () => {
      expect(handler("2")).toHaveProperty("status", 200);
    });

    test("it should return 404 Not Found if the matcher cannot be found", () => {
      const result = handler("0");
      expect(result).toHaveProperty("status", 404);
      expect(result).toHaveProperty("body", "Not Found");
    });
  });

  describe("createMatcherHandler", () => {
    let matcher;

    beforeEach(() => {
      matcher = {
        when: {},
        respond: {}
      };

      matcherStore = [
        {
          id: "1"
        },
        {
          id: "2"
        },
        {
          id: "3"
        }
      ];

      handler = shamCore.createMatcherHandler(matcherStore);
    });

    test("it should return the created", () => {
      expect(handler(matcher)).toHaveProperty("body", matcher);
    });

    test("it should set the id on the matcher", () => {
      handler(matcher);

      expect(matcher).toHaveProperty("id", shortid.__id);
    });

    test("it should return a status of 200", () => {
      expect(handler(matcher)).toHaveProperty("status", 200);
    });

    test("it should return 400 if there is no matcher", () => {
      const response = handler();

      expect(response).toHaveProperty("status", 400);
      expect(response).toHaveProperty(
        "body",
        "The matcher definition must be an object"
      );
    });

    test("it should return 400 if the matcher is not an object", () => {
      const response = handler(2);

      expect(response).toHaveProperty("status", 400);
      expect(response).toHaveProperty(
        "body",
        "The matcher definition must be an object"
      );
    });

    test("it should return 400 if the when property does not exist", () => {
      const response = handler({});

      expect(response).toHaveProperty("status", 400);
      expect(response).toHaveProperty(
        "body",
        "The matcher must contain a valid when property"
      );
    });

    test("it should return 400 if the when property is not an object", () => {
      const response = handler({ when: "bob" });

      expect(response).toHaveProperty("status", 400);
      expect(response).toHaveProperty(
        "body",
        "The matcher must contain a valid when property"
      );
    });

    test("it should return 400 if the respond property is not an object", () => {
      const response = handler({
        when: { op: "==", prop: "pathname", value: "/test" }
      });

      expect(response).toHaveProperty("status", 400);
      expect(response).toHaveProperty(
        "body",
        "The matcher must contain a valid respond property"
      );
    });

    test("it should return 400 if the respond property is not an object", () => {
      const response = handler({
        when: { op: "==", prop: "pathname", value: "/test" },
        respond: "bob"
      });

      expect(response).toHaveProperty("status", 400);
      expect(response).toHaveProperty(
        "body",
        "The matcher must contain a valid respond property"
      );
    });
  });

  describe("deleteMatcherHandler", () => {
    beforeEach(() => {
      matcherStore = [
        {
          id: "1"
        },
        {
          id: "2"
        },
        {
          id: "3"
        }
      ];

      handler = shamCore.deleteMatcherHandler(matcherStore);
    });

    test("it should not return any data", () => {
      expect(handler("2")).not.toHaveProperty("body");
    });

    test("it should return a status of 204", () => {
      expect(handler("2")).toHaveProperty("status", 204);
    });

    test("it should be idempotent", () => {
      expect(handler("2")).toHaveProperty("status", 204);
      expect(matcherStore).toHaveProperty("length", 2);

      expect(handler("2")).toHaveProperty("status", 204);
      expect(matcherStore).toHaveProperty("length", 2);

      expect(handler("2")).toHaveProperty("status", 204);
      expect(matcherStore).toHaveProperty("length", 2);

      expect(handler("2")).toHaveProperty("status", 204);
      expect(matcherStore).toHaveProperty("length", 2);
    });

    test("it should remove the matcher from the store", () => {
      handler("2");

      expect(matcherStore).toHaveProperty("length", 2);
      expect(matcherStore).not.toContainEqual({
        id: "2"
      });
    });
  });

  describe("resetHandler", () => {
    beforeEach(() => {
      matcherStore = [
        {
          id: "1"
        },
        {
          id: "2"
        },
        {
          id: "3"
        }
      ];

      requestStore = [{}, {}, {}];

      handler = shamCore.resetHandler(matcherStore, requestStore);
    });

    test("it should not return any data", () => {
      expect(handler()).not.toHaveProperty("body");
    });

    test("it should return a status of 204", () => {
      expect(handler()).toHaveProperty("status", 204);
    });

    test("it should be idempotent", () => {
      expect(handler()).toHaveProperty("status", 204);
      expect(handler()).toHaveProperty("status", 204);
      expect(handler()).toHaveProperty("status", 204);
      expect(handler()).toHaveProperty("status", 204);
    });
  });

  describe("shutdownHandler", () => {
    let server;
    beforeEach(() => {
      server = { close: jest.fn() };

      handler = shamCore.shutdownHandler(server);
    });

    it("should close the server", () => {
      handler();

      expect(server.close).toHaveBeenCalled();
    });

    test("it should return a status of 204", () => {
      expect(handler()).toHaveProperty("status", 204);
    });
  });
});
