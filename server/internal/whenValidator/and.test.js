const and = require("./and");

describe("unit: and", () => {
  let validate;
  let values;

  beforeEach(() => {
    validate = jest.fn(() => true);
    values = ["a", "b", "c"];

    validate.mockClear();
  });

  test("it should call validate for each value while it returns true", () => {
    and(validate, values);

    expect(validate).toHaveBeenCalledTimes(3);
    expect(validate).toHaveBeenCalledWith(values[0]);
    expect(validate).toHaveBeenCalledWith(values[1]);
    expect(validate).toHaveBeenCalledWith(values[2]);
  });

  test("it should return true if all of values validate to true", () => {
    expect(and(validate, values)).toBe(true);
  });

  it("it should return false if only a single value validates to false", () => {
    validate.mockImplementation(value => value !== "a");
    expect(and(validate, values)).toBe(false);

    validate.mockImplementation(value => value !== "c");
    expect(and(validate, values)).toBe(false);
  });

  test("it should stop validating values if one has validated to false", () => {
    validate.mockImplementation(value => value !== "b");

    expect(and(validate, values)).toBe(false);
    expect(validate).toHaveBeenCalledTimes(2);
    expect(validate).toHaveBeenCalledWith(values[0]);
    expect(validate).toHaveBeenCalledWith(values[1]);
    expect(validate).not.toHaveBeenCalledWith(values[2]);
  });
});
