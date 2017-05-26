const deleteMatcher = require("./deleteMatcher");

describe("unit: deleteMatcher", () => {
  let handler;
  let matcherStore;

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

    handler = deleteMatcher(matcherStore);
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
