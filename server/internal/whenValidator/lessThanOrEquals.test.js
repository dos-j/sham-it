const lessThanOrEquals = require("./lessThanOrEquals");

jest.mock("./traverse", () => jest.fn(() => undefined));
const traverse = require("./traverse");

describe("unit: lessThanOrEquals", () => {
  let request;
  let prop;

  beforeEach(() => {
    request = { body: { a: 5 } };
    prop = "body.a";

    traverse.mockClear();
  });

  test("it should traverse the request to get the correct property", () => {
    lessThanOrEquals(request, prop, 5);

    expect(traverse).toHaveBeenCalledWith(request, prop);
  });

  test("it should return true if the found value is lessThan the test value", () => {
    traverse.mockImplementationOnce(() => 4);

    expect(lessThanOrEquals(request, prop, 5)).toBe(true);
  });

  test("it should return false if the found value is not lessThanOrEquals the test value", () => {
    traverse.mockImplementationOnce(() => 6);

    expect(lessThanOrEquals(request, prop, 5)).toBe(false);
  });

  test("it should return true if the found value equals the test value", () => {
    traverse.mockImplementationOnce(() => 5);

    expect(lessThanOrEquals(request, prop, 5)).toBe(true);
  });
});
