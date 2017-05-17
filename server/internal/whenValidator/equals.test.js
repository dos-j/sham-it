const equals = require("./equals");

jest.mock("./traverse", () => jest.fn(() => undefined));
const traverse = require("./traverse");

describe("unit: equals", () => {
  let request;
  let prop;

  beforeEach(() => {
    request = { pathname: "/test" };
    prop = "pathname";

    traverse.mockClear();
  });

  test("it should traverse the request to get the correct property", () => {
    equals(request, prop, "/test");

    expect(traverse).toHaveBeenCalledWith(request, prop);
  });

  test("it should return true if the found value equals the test value", () => {
    traverse.mockImplementationOnce(() => "/test");

    expect(equals(request, prop, "/test")).toBe(true);
  });

  test("it should return false if the found value does not equal the test value", () => {
    traverse.mockImplementationOnce(() => "/somethingelse");

    expect(equals(request, prop, "/test")).toBe(false);
  });
});
