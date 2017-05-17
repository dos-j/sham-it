const tryMatchRequest = require("./tryMatchRequest");

jest.mock("./whenValidator/whenValidator", () => jest.fn(() => true));
const whenValidator = require("./whenValidator/whenValidator");

describe("unit tryMatchRequest", () => {
  let request;
  let query;

  beforeEach(() => {
    request = { request: { pathname: "/test" } };
    query = { op: "equals", prop: "pathname", value: "/test" };
  });

  test("it should call the whenValidator to check if the request is a match", () => {
    tryMatchRequest(request, query);

    expect(whenValidator).toHaveBeenCalledWith(request.request, query);
  });

  test("it should return the request if the whenValidator returns true", () => {
    expect(tryMatchRequest(request, query)).toBe(request);
  });

  test("it should return undefined if the whenValidator returns false", () => {
    whenValidator.mockImplementationOnce(() => false);

    expect(tryMatchRequest(request, query)).toBeUndefined();
  });
});
