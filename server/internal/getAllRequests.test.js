const getAllRequests = require("./getAllRequests");

describe("unit: getAllRequests", () => {
  let handler;
  let requestStore;

  beforeEach(() => {
    requestStore = [{}, {}, {}];

    handler = getAllRequests(requestStore);
  });

  test("it should return all requests", () => {
    expect(handler()).toHaveProperty("body", requestStore);
  });

  test("it should return a status of 200", () => {
    expect(handler()).toHaveProperty("status", 200);
  });
});
