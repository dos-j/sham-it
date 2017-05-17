const or = require("./or");

describe("unit: or", () => {
  let validate;
  let values;

  beforeEach(() => {
    validate = jest.fn(() => false);
    values = ["a", "b", "c"];

    validate.mockClear();
  });

  test("it should call validate for each value until it returns true", () => {
    or(validate, values);

    expect(validate).toHaveBeenCalledTimes(3);
    expect(validate).toHaveBeenCalledWith(values[0]);
    expect(validate).toHaveBeenCalledWith(values[1]);
    expect(validate).toHaveBeenCalledWith(values[2]);
  });

  test("it should return false if all of values validate to false", () => {
    expect(or(validate, values)).toBe(false);
  });

  test("it should return true if only a single value validates to true", () => {
    validate.mockImplementation(value => value === "a");
    expect(or(validate, values)).toBe(true);

    validate.mockImplementation(value => value === "c");
    expect(or(validate, values)).toBe(true);
  });

  test("it should stop validating values if one has validated to true", () => {
    validate.mockImplementation(value => value === "b");

    expect(or(validate, values)).toBe(true);
    expect(validate).toHaveBeenCalledTimes(2);
    expect(validate).toHaveBeenCalledWith(values[0]);
    expect(validate).toHaveBeenCalledWith(values[1]);
    expect(validate).not.toHaveBeenCalledWith(values[2]);
  });
});
