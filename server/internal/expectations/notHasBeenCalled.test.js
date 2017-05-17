const notHasBeenCalled = require("./notHasBeenCalled");

describe("unit: notHasBeenCalled", () => {
  let handler;
  let requestStore;

  beforeEach(() => {
    requestStore = [];
    handler = notHasBeenCalled(requestStore);
  });

  test("it should return 204 No Content if there are no requests in the requestStore", () => {
    expect(handler()).toEqual({ status: 204 });
  });

  test("it should return 417 Expectation failed if there are requests in the requestStore", () => {
    requestStore.push({
      request: {
        method: "GET",
        pathname: "/test",
        query: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });

    expect(handler()).toEqual(
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

    expect(handler().body).toMatchSnapshot();
  });
});
