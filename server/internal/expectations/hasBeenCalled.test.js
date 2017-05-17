const hasBeenCalled = require("./hasBeenCalled");

describe("unit: hasBeenCalled", () => {
  let handler;
  let requestStore;

  beforeEach(() => {
    requestStore = [];
    handler = hasBeenCalled(requestStore);
  });

  test("it should return 204 No Content if there arerequests in the requestStore", () => {
    requestStore.push({
      request: {
        method: "GET",
        pathname: "/test",
        query: { a: 1234 },
        headers: { accept: "application/json" }
      }
    });

    expect(handler()).toEqual({ status: 204 });
  });

  test("it should return 417 Expectation failed if there are no requests in the requestStore", () => {
    expect(handler()).toEqual(
      expect.objectContaining({
        status: 417
      })
    );
  });

  test("the error message should match the snapshot", () => {
    expect(handler().body).toMatchSnapshot();
  });
});
