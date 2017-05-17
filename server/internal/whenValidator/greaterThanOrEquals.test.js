const greaterThanOrEquals = require("./greaterThanOrEquals");

jest.mock("./traverse", () => jest.fn(() => undefined));
const traverse = require("./traverse");

describe("unit: greaterThanOrEquals", () => {
  let request;
  let prop;

  beforeEach(() => {
    request = { body: { a: 5 } };
    prop = "body.a";

    traverse.mockClear();
  });

  test("it should traverse the request to get the correct property", () => {
    greaterThanOrEquals(request, prop, 5);

    expect(traverse).toHaveBeenCalledWith(request, prop);
  });

  test("it should return true if the found value is greaterThan the test value", () => {
    traverse.mockImplementationOnce(() => 6);

    expect(greaterThanOrEquals(request, prop, 5)).toBe(true);
  });

  test("it should return false if the found value is not greaterThanOrEquals the test value", () => {
    traverse.mockImplementationOnce(() => 4);

    expect(greaterThanOrEquals(request, prop, 5)).toBe(false);
  });

  test("it should return true if the found value equals the test value", () => {
    traverse.mockImplementationOnce(() => 5);

    expect(greaterThanOrEquals(request, prop, 5)).toBe(true);
  });
});
