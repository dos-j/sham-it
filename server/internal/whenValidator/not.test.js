const not = require("./not");

describe("unit: not", () => {
  let validate;
  let value;

  beforeEach(() => {
    validate = jest.fn(() => true);
    value = { op: "EQUALS", prop: "pathname", value: "/test" };
  });

  test("it should call whenValidator", () => {
    not(validate, value);

    expect(validate).toHaveBeenCalledWith(value);
  });

  test("it should return false if the whenValidator returns true", () => {
    expect(not(validate, value)).toBe(false);
  });

  test("it should return true if the whenValidator returns false", () => {
    validate.mockImplementation(() => false);

    expect(not(validate, value)).toBe(true);
  });
});
