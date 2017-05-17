const requestParser = require("./requestParser");
const EventEmitter = require("events");

describe("unit: requestParser", () => {
  beforeEach(() => {
    request = new EventEmitter();
    request.headers = { "Content-Type": "application/json" };
    request.method = "POST";
    request.url = "http://localhost/test?a=1&b=2";
  });

  test("it should include the headers and method property from the original request", async () => {
    const promise = requestParser(request);

    request.emit("end");

    const result = await promise;

    expect(result).toHaveProperty("headers", request.headers);
    expect(result).toHaveProperty("method", request.method);
  });

  test("it should extract the pathname from the url", async () => {
    const promise = requestParser(request);

    request.emit("end");

    const result = await promise;

    expect(result).toHaveProperty("pathname", "/test");
  });

  test("it should throw an error if the original request emit's an error", async () => {
    const promise = requestParser(request);

    const expected = new Error("test");
    request.emit("error", expected);

    let actual;
    try {
      await promise;
    } catch (ex) {
      actual = ex;
    }

    expect(actual).toBe(expected);
  });

  test("it should chunk the data from the request", async () => {
    const promise = requestParser(request);

    request.emit("data", "t");
    request.emit("data", "e");
    request.emit("data", "s");
    request.emit("data", "t");
    request.emit("end");

    const result = await promise;

    expect(result).toHaveProperty("body", "test");
  });

  test("it should handle a request with no data", async () => {
    const promise = requestParser(request);

    request.emit("end");

    const result = await promise;

    expect(result).toHaveProperty("body", "");
  });

  test("it should parse a JSON object", async () => {
    const promise = requestParser(request);

    request.emit("data", "{");
    request.emit("data", '"a":');
    request.emit("data", "1");
    request.emit("data", "}");
    request.emit("end");

    const result = await promise;

    expect(result).toHaveProperty("body", { a: 1 });
  });

  test("it should parse a JSON array", async () => {
    const promise = requestParser(request);

    request.emit("data", "[");
    request.emit("data", "1,2,");
    request.emit("data", "3]");
    request.emit("end");

    const result = await promise;

    expect(result).toHaveProperty("body", [1, 2, 3]);
  });

  test("it should not try to parse a string", async () => {
    const promise = requestParser(request);

    const expected = "hello world 123 12 123&$@! {[]}";
    request.emit("data", expected);
    request.emit("end");

    const result = await promise;

    expect(result).toHaveProperty("body", expected);
  });

  test("it should extract querystring parameters", async () => {
    const promise = requestParser(request);

    request.emit("end");

    const result = await promise;

    expect(result).toHaveProperty("query", { a: "1", b: "2" });
  });
});
