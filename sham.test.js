const sham = require("./sham");

jest.mock("portfinder", () => ({
  getPortPromise: jest.fn(() => new Promise(resolve => resolve(8000)))
}));
const portfinder = require("portfinder");

jest.mock("http", () => {
  const close = jest.fn(() => {
    server.listening = false;
  });
  const listen = jest.fn(() => {
    server.listening = true;
  });
  const server = { listen, close, listening: false };
  const createServer = jest.fn(() => server);

  return {
    createServer,
    __server: server
  };
});
const http = require("http");

let res;

beforeEach(() => {
  portfinder.getPortPromise.mockClear();
  http.createServer.mockClear();
  http.__server.close.mockClear();
  http.__server.listen.mockClear();

  res = {
    writeHead: jest.fn(),
    end: jest.fn()
  };
});

describe("Choosing an IP Address", () => {
  test("uses 0.0.0.0 as the ip when one is not provided", async () => {
    const result = await sham();

    expect(result.ip).toBe("0.0.0.0");
  });

  test("uses the ip provided", async () => {
    const result = await sham({ ip: "1.1.1.1" });

    expect(result.ip).toBe("1.1.1.1");
  });
});

describe("Choosing a Port", () => {
  test("uses portfinder to find an available port if one is not provided", async () => {
    const result = await sham();

    expect(require("portfinder").getPortPromise).toHaveBeenCalled();
    expect(result.port).toBe(8000);
  });

  test("uses the port provided", async () => {
    const result = await sham({ port: 9000 });

    expect(result.port).toBe(9000);
  });

  test("does not call portfinder if a port has been provided", async () => {
    const result = await sham({ port: 9000 });

    expect(require("portfinder").getPortPromise).not.toHaveBeenCalled();
  });
});

describe("Creating the Http Server", () => {
  test("creates a http server and listens on the default ip/port", async () => {
    const result = await sham();

    expect(http.__server.listen).toHaveBeenCalledWith(8000, "0.0.0.0");
  });

  test("listens on the correct ports", async () => {
    const result = await sham({ ip: "127.0.0.1", port: 9000 });

    expect(http.__server.listen).toHaveBeenCalledWith(9000, "127.0.0.1");
  });

  test("the http server should be listening when it has been created", async () => {
    const result = await sham();

    expect(http.__server.listening).toBe(true);
    expect(result.listening).toBe(true);
  });

  test("closing the http server should stop the server listening", async () => {
    const result = await sham();

    result.close();

    expect(http.__server.listening).toBe(false);
    expect(result.listening).toBe(false);
  });
});

describe("Returning a Default Reply", () => {
  test("it should respond with the default reply if there are no mocked routes", async () => {
    const result = await sham();

    const [[handler]] = http.createServer.mock.calls;

    handler({}, res);

    expect(res.writeHead).toHaveBeenCalledWith(404, {
      "Content-Type": "text/plain"
    });
    expect(res.end).toHaveBeenCalledWith("Not Found");
  });

  test("it should allow you to override the default reply", async () => {
    const result = await sham({
      defaultReply: {
        status: 418,
        headers: { "Content-Type": "text/fancy" },
        body: "Tadaaaa!"
      }
    });

    const [[handler]] = http.createServer.mock.calls;

    handler({}, res);

    expect(res.writeHead).toHaveBeenCalledWith(418, {
      "Content-Type": "text/fancy"
    });
    expect(res.end).toHaveBeenCalledWith("Tadaaaa!");
  });
});

describe("Configuring mocked routes", () => {
  let handler;
  let server;
  beforeEach(async () => {
    server = await sham();

    handler = http.createServer.mock.calls[0][0];
  });
  test("it should allow you to mock responses", () => {
    const mock = {
      status: 200,
      headers: {
        "Content-Type": "text/plain"
      },
      body: "Test"
    };
    server.when(() => true, mock);

    const req = {};
    handler(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(mock.status, mock.headers);

    expect(res.end).toHaveBeenCalledWith(mock.body);
  });

  test("it should assume you want a status of 200 if you don't specify it", () => {
    const mock = {
      headers: {
        "Content-Type": "text/plain"
      },
      body: "Test"
    };
    server.when(() => true, mock);

    const req = {};
    handler(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(200, mock.headers);

    expect(res.end).toHaveBeenCalledWith(mock.body);
  });

  test("it should assume you want a Content-Type of 'application/json' if you don't specify it", () => {
    const mock = {
      status: 200,
      body: "{}"
    };
    server.when(() => true, mock);

    const req = {};
    handler(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(mock.status, {
      "Content-Type": "application/json"
    });

    expect(res.end).toHaveBeenCalledWith(mock.body);
  });

  test("it should automatically stringify the body", () => {
    const mock = {
      body: {
        a: 1
      }
    };
    server.when(() => true, mock);

    const req = {};
    handler(req, res);

    expect(res.end).toHaveBeenCalledWith(JSON.stringify(mock.body));
  });

  test("it should not return the mock if the matcher returns false", () => {
    const mock = {
      body: "{}"
    };
    server.when(() => false, mock);

    const req = {};
    handler(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(404, {
      "Content-Type": "text/plain"
    });
    expect(res.end).toHaveBeenCalledWith("Not Found");
  });

  test("it should give the matcher the request object to check", () => {
    const mock = {
      body: {
        a: 1
      }
    };
    const matcher = jest.fn(() => true);
    server.when(matcher, mock);

    const req = {};
    handler(req, res);

    expect(matcher).toHaveBeenCalledWith(req);
  });

  test("it should check matchers in reverse order and only check the first matcher if it returns true", () => {
    const matcherA = jest.fn(() => true);
    const matcherB = jest.fn(() => true);
    const matcherC = jest.fn(() => true);
    server.when(matcherA, { body: { a: 1 } });
    server.when(matcherB, { body: { b: 2 } });
    server.when(matcherC, { body: { c: 3 } });

    const req = {};
    handler(req, res);

    expect(matcherC).toHaveBeenCalled();
    expect(matcherB).not.toHaveBeenCalled();
    expect(matcherA).not.toHaveBeenCalled();

    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ c: 3 }));
  });

  test("it should check all matchers if none of them return true", () => {
    const matcherA = jest.fn(() => false);
    const matcherB = jest.fn(() => false);
    const matcherC = jest.fn(() => false);
    server.when(matcherA, { body: { a: 1 } });
    server.when(matcherB, { body: { b: 2 } });
    server.when(matcherC, { body: { c: 3 } });

    const req = {};
    handler(req, res);

    expect(matcherC).toHaveBeenCalled();
    expect(matcherB).toHaveBeenCalled();
    expect(matcherA).toHaveBeenCalled();

    expect(res.end).toHaveBeenCalledWith("Not Found");
  });

  test("it should be able to return the mock for a matcher in the middle of the list of matchers", () => {
    const matcherA = jest.fn(() => true);
    const matcherB = jest.fn(() => true);
    const matcherC = jest.fn(() => false);
    server.when(matcherA, { body: { a: 1 } });
    server.when(matcherB, { body: { b: 2 } });
    server.when(matcherC, { body: { c: 3 } });

    const req = {};
    handler(req, res);

    expect(matcherC).toHaveBeenCalled();
    expect(matcherB).toHaveBeenCalled();
    expect(matcherA).not.toHaveBeenCalled();

    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ b: 2 }));
  });
});

describe("Clearing the mocks", () => {
  let handler;
  let server;
  beforeEach(async () => {
    server = await sham();

    handler = http.createServer.mock.calls[0][0];
  });

  test("it should not check matchers if they have been reset", () => {
    const matcherA = jest.fn(() => true);
    const matcherB = jest.fn(() => true);
    const matcherC = jest.fn(() => true);
    server.when(matcherA, { body: { a: 1 } });
    server.when(matcherB, { body: { b: 2 } });
    server.when(matcherC, { body: { c: 3 } });

    server.reset();

    const req = {};
    handler(req, res);

    expect(matcherC).not.toHaveBeenCalled();
    expect(matcherB).not.toHaveBeenCalled();
    expect(matcherA).not.toHaveBeenCalled();

    expect(res.end).toHaveBeenCalledWith("Not Found");
  });
});

describe("Mocks that expire", () => {
  let handler;
  let server;
  beforeEach(async () => {
    server = await sham();

    handler = http.createServer.mock.calls[0][0];
  });

  test("it should only match once", () => {
    const matcher = jest.fn(() => true);
    server.when(matcher, { body: "Test" }, 1);

    const req = {};
    handler(req, res);

    expect(res.end).lastCalledWith("Test");

    handler(req, res);

    expect(res.end).lastCalledWith("Not Found");
  });

  test("it should only match twice", () => {
    const matcher = jest.fn(() => true);
    server.when(matcher, { body: "Test" }, 2);

    const req = {};
    handler(req, res);

    expect(res.end).lastCalledWith("Test");

    handler(req, res);

    expect(res.end).lastCalledWith("Test");

    handler(req, res);

    expect(res.end).lastCalledWith("Not Found");
  });

  test("it should throw an error if you try set it to return 0 times", () => {
    const matcher = jest.fn(() => true);

    expect(() => server.when(matcher, { body: "Test" }, 0)).toThrow(
      new Error("0 is not a valid number of times this matcher can match")
    );
  });

  test("it should throw an error if you try set it to return null times", () => {
    const matcher = jest.fn(() => true);

    expect(() => server.when(matcher, { body: "Test" }, null)).toThrow(
      new Error("null is not a valid number of times this matcher can match")
    );
  });

  test("it should throw an error if you try set it to return -1 times", () => {
    const matcher = jest.fn(() => true);

    expect(() => server.when(matcher, { body: "Test" }, -1)).toThrow(
      new Error("-1 is not a valid number of times this matcher can match")
    );
  });
});
