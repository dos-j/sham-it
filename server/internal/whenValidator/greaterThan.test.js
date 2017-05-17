const greaterThan = require("./greaterThan");

jest.mock("./traverse", () => jest.fn(() => undefined));
const traverse = require("./traverse");

describe("unit: greaterThan", () => {
  let request;
  let prop;

  beforeEach(() => {
    request = { body: { a: 5 } };
    prop = "body.a";

    traverse.mockClear();
  });

  test("it should traverse the request to get the correct property", () => {
    greaterThan(request, prop, 5);

    expect(traverse).toHaveBeenCalledWith(request, prop);
  });

  test("it should return true if the found value is greaterThan the test value", () => {
    traverse.mockImplementationOnce(() => 6);

    expect(greaterThan(request, prop, 5)).toBe(true);
  });

  test("it should return false if the found value is not geaterThan the test value", () => {
    traverse.mockImplementationOnce(() => 4);

    expect(greaterThan(request, prop, 5)).toBe(false);
  });
});
