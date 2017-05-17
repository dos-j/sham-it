const notHasBeenCalledWith = require("./notHasBeenCalledWith");

describe("unit: notHasBeenCalledWith", () => {
  let handler;
  let requestStore;

  beforeEach(() => {
    requestStore = [];
    handler = notHasBeenCalledWith(requestStore);
  });

  test("it should return 204 No Content if the query given matches the number of requests in the requestStore", () => {
    requestStore.push({
      request: {
        method: "GET",
        pathname: "/test1",
        query: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });
    requestStore.push({
      request: {
        method: "GET",
        pathname: "/test2",
        query: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });
    requestStore.push({
      request: {
        method: "GET",
        pathname: "/test3",
        query: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });

    expect(handler({ op: "==", prop: "pathname", value: "/test4" })).toEqual({
      status: 204
    });
  });

  test("it should return 417 Expectation failed if query given does not match the number of requests in the requestStore", () => {
    requestStore.push({
      request: {
        method: "GET",
        pathname: "/test1",
        query: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });
    requestStore.push({
      request: {
        method: "GET",
        pathname: "/test2",
        query: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });
    requestStore.push({
      request: {
        method: "GET",
        pathname: "/test3",
        query: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });

    expect(handler({ op: "==", prop: "pathname", value: "/test2" })).toEqual(
      expect.objectContaining({
        status: 417
      })
    );
  });

  test("the error message should match the snapshot", () => {
    requestStore.push({
      request: {
        method: "GET",
        pathname: "/test1",
        query: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });
    requestStore.push({
      request: {
        method: "GET",
        pathname: "/test2",
        query: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });
    requestStore.push({
      request: {
        method: "GET",
        pathname: "/test3",
        query: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });

    expect(
      handler({ op: "==", prop: "pathname", value: "/test2" })
    ).toMatchSnapshot();
  });
});
