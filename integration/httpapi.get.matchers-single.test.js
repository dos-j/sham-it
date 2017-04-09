const shamIt = require("sham-it");
const fetch = require("node-fetch");

let sham;

describe("Integration: HTTP API GET /$matchers/{id}", () => {
  beforeEach(async () => {
    sham = await shamIt({
      defaultReply: {
        status: 500,
        headers: { "Content-Type": "text/plain" },
        body: "Internal Server Error"
      }
    });
  });
  afterEach(() => {
    sham.close();
  });

  test("it should return a 404 if a matcher with the specified id doesn't exist", async () => {
    const response = await fetch(
      `http://localhost:${sham.port}/$matchers/9876`
    );

    expect(response).toHaveProperty("status", 404);
  });

  test("it should respond with a descriptive not found message", async () => {
    const response = await fetch(
      `http://localhost:${sham.port}/$matchers/9876`
    );
    const message = await response.text();

    expect(message).toEqual("Matcher with Id '9876' could not be found");
  });

  test("it should respond with a matcher if it exists", async () => {
    const matcher = sham.when(() => true, { body: "a" }, 1);

    const response = await fetch(
      `http://localhost:${sham.port}/$matchers/${matcher.id}`
    );
    const body = await response.json();

    expect(response).toHaveProperty("status", 200);
    expect(body).toHaveProperty("id", matcher.id);
    expect(body).toHaveProperty("when", matcher.matcher.toString());
    expect(body).toHaveProperty("respond", matcher.mock);
    expect(body).toHaveProperty("times", matcher.times);
  });
});
