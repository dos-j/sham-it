const whenValidator = require("./whenValidator");

jest.mock("./and", () => jest.fn(() => "AND"));
jest.mock("./or", () => jest.fn(() => "OR"));
jest.mock("./equals", () => jest.fn(() => "EQUALS"));
jest.mock("./not", () => jest.fn(() => "NOT"));
jest.mock("./greaterThan", () => jest.fn(() => "GREATER_THAN"));
jest.mock("./greaterThanOrEquals", () =>
  jest.fn(() => "GREATER_THAN_OR_EQUALS"));
jest.mock("./lessThan", () => jest.fn(() => "LESS_THAN"));
jest.mock("./lessThanOrEquals", () => jest.fn(() => "LESS_THAN_OR_EQUALS"));
jest.mock("./regex", () => jest.fn(() => "REGEX"));

const and = require("./and");
const or = require("./or");
const equals = require("./equals");
const not = require("./not");
const greaterThan = require("./greaterThan");
const greaterThanOrEquals = require("./greaterThanOrEquals");
const lessThan = require("./lessThan");
const lessThanOrEquals = require("./lessThanOrEquals");
const regex = require("./regex");

describe("unit: whenValidator", () => {
  let request;
  beforeEach(() => {
    request = {
      pathname: "test",
      headers: { "Content-Type": "application/json" }
    };

    and.mockClear();
    or.mockClear();
    equals.mockClear();
    not.mockClear();
    greaterThan.mockClear();
    greaterThanOrEquals.mockClear();
    lessThan.mockClear();
    lessThanOrEquals.mockClear();
    regex.mockClear();
  });

  test("it should call 'and' and return if the op is 'AND'", () => {
    const result = whenValidator(request, { op: "AND", values: [1, 2, 3] });

    expect(result).toBe("AND");
    expect(and).toHaveBeenCalledWith(expect.any(Function), [1, 2, 3]);
  });

  test("it should call 'or' and return if the op is 'OR'", () => {
    const result = whenValidator(request, { op: "OR", values: [1, 2, 3] });

    expect(result).toBe("OR");
    expect(or).toHaveBeenCalledWith(expect.any(Function), [1, 2, 3]);
  });

  test("it should call 'equals' and return if the op is '=='", () => {
    const result = whenValidator(request, {
      op: "==",
      prop: "pathname",
      value: "test"
    });

    expect(result).toBe("EQUALS");
    expect(equals).toHaveBeenCalledWith(request, "pathname", "test");
  });

  test("it should call 'not' and return if the op is '!'", () => {
    const result = whenValidator(request, { op: "!", value: true });

    expect(result).toBe("NOT");
    expect(not).toHaveBeenCalledWith(expect.any(Function), true);
  });

  test("it should call 'greaterThan' and return if the op is '>'", () => {
    const result = whenValidator(request, {
      op: ">",
      prop: "pathname",
      value: "/test"
    });

    expect(result).toBe("GREATER_THAN");
    expect(greaterThan).toHaveBeenCalledWith(request, "pathname", "/test");
  });

  test("it should call 'greaterThanOrEquals' and return if the op is '>='", () => {
    const result = whenValidator(request, {
      op: ">=",
      prop: "pathname",
      value: "/test"
    });

    expect(result).toBe("GREATER_THAN_OR_EQUALS");
    expect(greaterThanOrEquals).toHaveBeenCalledWith(
      request,
      "pathname",
      "/test"
    );
  });

  test("it should call 'lessThan' and return if the op is '<'", () => {
    const result = whenValidator(request, {
      op: "<",
      prop: "pathname",
      value: "/test"
    });

    expect(result).toBe("LESS_THAN");
    expect(lessThan).toHaveBeenCalledWith(request, "pathname", "/test");
  });

  test("it should call 'lessThanOrEquals' and return if the op is '<='", () => {
    const result = whenValidator(request, {
      op: "<=",
      prop: "pathname",
      value: "/test"
    });

    expect(result).toBe("LESS_THAN_OR_EQUALS");
    expect(lessThanOrEquals).toHaveBeenCalledWith(request, "pathname", "/test");
  });

  test("it should call 'regex' and return if the op is 'regex'", () => {
    const result = whenValidator(request, {
      op: "REGEX",
      prop: "pathname",
      value: [".*", "g"]
    });

    expect(result).toBe("REGEX");
    expect(regex).toHaveBeenCalledWith(request, "pathname", [".*", "g"]);
  });
});
