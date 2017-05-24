const healthcheck = require("./healthcheck");

describe("unit: healthcheck", () => {
  let handler;

  beforeEach(() => {
    handler = healthcheck();
  });

  test("it should return 200 Success", () => {
    expect(handler()).toEqual({ status: 200, body: "Success" });
  });
});
