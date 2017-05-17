const notHasBeenLastCalledWith = require("./notHasBeenLastCalledWith");

describe("unit: notHasBeenLastCalledWith", () => {
  let handler;
  let requestStore;

  beforeEach(() => {
    requestStore = [];
    handler = notHasBeenLastCalledWith(requestStore);
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

    expect(handler({ op: "==", prop: "pathname", value: "/test2" })).toEqual({
      status: 204
    });
  });

  test("it should return 204 No Content if there is no last request", () => {
    expect(handler({ op: "==", prop: "pathname", value: "/test2" })).toEqual(
      expect.objectContaining({
        status: 204
      })
    );
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

    expect(handler({ op: "==", prop: "pathname", value: "/test2" })).toEqual(
      expect.objectContaining({
        status: 417
      })
    );
  });

  test("it should show a detailed error message including the query and the last request", () => {
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
      handler({ op: "==", prop: "pathname", value: "/test3" })
    ).toMatchSnapshot();
  });
});
