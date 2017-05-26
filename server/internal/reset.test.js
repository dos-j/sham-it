const reset = require("./reset");

describe("unit: reset", () => {
  let handler;
  let matcherStore;
  let requestStore;

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

    handler = reset(matcherStore, requestStore);
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
