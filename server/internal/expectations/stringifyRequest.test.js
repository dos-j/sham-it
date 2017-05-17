const stringifyRequest = require("./stringifyRequest");

describe("unit: stringifyRequest", () => {
  test("it should stringify a request", () => {
    expect(
      stringifyRequest({
        request: {
          method: "GET",
          pathname: "/test"
        }
      })
    ).toMatchSnapshot();
  });

  test("it should include the headers if they are available", () => {
    expect(
      stringifyRequest({
        request: {
          method: "GET",
          pathname: "/test",
          headers: { Accept: "application/json" }
        }
      })
    ).toMatchSnapshot();
  });

  test("it should include a querystring if there are query parameters", () => {
    expect(
      stringifyRequest({
        request: {
          method: "POST",
          pathname: "/test",
          query: { top: 100, skip: 500 }
        }
      })
    ).toMatchSnapshot();
  });

  test("it should include a body if one was sent", () => {
    expect(
      stringifyRequest({
        request: {
          method: "POST",
          pathname: "/test",
          body: "hello world"
        }
      })
    ).toMatchSnapshot();
  });

  test("it should json serialize the body if it is an object", () => {
    expect(
      stringifyRequest({
        request: {
          method: "POST",
          pathname: "/test",
          headers: { "Content-Type": "application/json" },
          body: { a: 1 }
        }
      })
    ).toMatchSnapshot();
  });
});
