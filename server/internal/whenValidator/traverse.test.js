const traverse = require("./traverse");

describe("unit: traverse", () => {
  test("it should retrieve the correct property from request", () => {
    expect(traverse({ pathname: "/test" }, "pathname")).toBe("/test");
  });

  test("it should remove request. from the start if it`s there", () => {
    expect(traverse({ pathname: "/test" }, "request.pathname")).toBe("/test");
  });

  test("it should retrieve a nested property from the request", () => {
    expect(traverse({ body: { a: 1 } }, "request.body.a")).toBe(1);
  });

  test("it should return undefined if the path is invalid for the target", () => {
    expect(
      traverse({ body: { a: 1 } }, "request.body.values.a")
    ).toBeUndefined();
  });
});
