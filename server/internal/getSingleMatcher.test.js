const getSingleMatcher = require("./getSingleMatcher");

describe("unit: getSingleMatcher", () => {
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

    handler = getSingleMatcher(matcherStore);
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
