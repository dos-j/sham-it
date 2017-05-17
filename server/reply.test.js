const reply = require("./reply");

describe("unit: reply", () => {
  let res;

  beforeEach(() => {
    res = {
      writeHead: jest.fn(),
      end: jest.fn()
    };
  });

  test("it should not stringify the body if it is a string", () => {
    reply(res, {
      status: 500,
      headers: { test: 1 },
      body: "Internal Server Error"
    });

    expect(res.writeHead(500, { test: 1 }));
    expect(res.end).toHaveBeenCalledWith("Internal Server Error");
  });

  test("it should use a default header of text/plain if the body is a string", () => {
    reply(res, { status: 500, body: "Internal Server Error" });

    expect(res.writeHead(500, { "Content-Type": "text/plain" }));
  });

  test("it should not stringify the body if it is an integer", () => {
    reply(res, { status: 500, headers: { test: 1 }, body: 500 });

    expect(res.writeHead(500, { test: 1 }));
    expect(res.end).toHaveBeenCalledWith(500);
  });

  test("it should not pass any data to end if the body is undefined", () => {
    reply(res, { status: 204, headers: { test: 1 } });

    expect(res.writeHead(204, { test: 1 }));
    expect(res.end).toHaveBeenCalledWith();
  });

  test("it should use an empty object as the default header if the body is undefined", () => {
    reply(res, { status: 204 });

    expect(res.writeHead(204, {}));
    expect(res.end).toHaveBeenCalledWith();
  });

  test("it should stringify the body if it is an object", () => {
    reply(res, { status: 200, headers: { test: 1 }, body: { a: 1 } });

    expect(res.writeHead(200, { test: 1 }));
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ a: 1 }));
  });

  test("it should use a default header of application/json if the body is an object", () => {
    reply(res, { status: 200, body: { a: 1 } });

    expect(res.writeHead(200, { "Content-Type": "application/json" }));
  });

  test("it should use a default status of 200", () => {
    reply(res, { body: { a: 1 } });

    expect(res.writeHead(200, { "Content-Type": "application/json" }));
  });
});
