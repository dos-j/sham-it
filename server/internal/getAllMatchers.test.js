const getAllMatchers = require("./getAllMatchers");

describe("unit: getAllMatchers", () => {
  let handler;
  let matcherStore;

  beforeEach(() => {
    matcherStore = [{}, {}, {}];

    handler = getAllMatchers(matcherStore);
  });

  test("it should return all matchers", () => {
    expect(handler()).toHaveProperty("body", matcherStore);
  });

  test("it should return a status of 200", () => {
    expect(handler()).toHaveProperty("status", 200);
  });
});
