const hasBeenCalledTimes = require("./hasBeenCalledTimes");

describe("unit: hasBeenCalledTimes", () => {
  let handler;
  let requestStore;

  beforeEach(() => {
    requestStore = [];
    handler = hasBeenCalledTimes(requestStore);
  });

  test("it should return 204 No Content if the times given matches the number of requests in the requestStore", () => {
    requestStore.push({
      request: {
        method: "GET",
        pathname: "/test",
        query: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });
    requestStore.push({
      request: {
        method: "GET",
        pathname: "/test",
        query: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });
    requestStore.push({
      request: {
        method: "GET",
        pathname: "/test",
        query: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });

    expect(handler(3)).toEqual({ status: 204 });
  });

  test("it should return 417 Expectation failed if times given does not match the number of requests in the requestStore", () => {
    requestStore.push({
      request: {
        method: "GET",
        pathname: "/test",
        query: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });
    requestStore.push({
      request: {
        method: "GET",
        pathname: "/test",
        query: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });

    expect(handler(3)).toEqual(
      expect.objectContaining({
        status: 417
      })
    );
  });

  test("the error message should match the snapshot", () => {
    requestStore.push({
      request: {
        method: "GET",
        pathname: "/test",
        query: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });
    requestStore.push({
      request: {
        method: "POST",
        pathname: "/test/1234",
        body: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });
    requestStore.push({
      request: {
        method: "POST",
        pathname: "/test/abc",
        body: "test",
        headers: { accept: "application/json" }
      }
    });

    expect(handler(5).body).toMatchSnapshot();
  });
});
