const sham = require("sham-server");

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

jest.mock("./handlerFactory", () => {
  const handlerFactory = jest.fn(() => handlerFactory.__handler);
  handlerFactory.__handler = jest.fn();
  handlerFactory.__handler.matchers = [];
  handlerFactory.__handler.calls = [];

  return handlerFactory;
});
const handlerFactory = require("./handlerFactory");

beforeEach(() => {
  portfinder.getPortPromise.mockClear();
  http.createServer.mockClear();
  http.__server.close.mockClear();
  http.__server.listen.mockClear();
  handlerFactory.__handler.matchers.length = 0;
  handlerFactory.__handler.calls.length = 0;

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
    await sham({ port: 9000 });

    expect(require("portfinder").getPortPromise).not.toHaveBeenCalled();
  });
});

describe("Creating the Http Server", () => {
  test("creates a http server and listens on the default ip/port", async () => {
    await sham();

    expect(http.__server.listen).toHaveBeenCalledWith(8000, "0.0.0.0");
  });

  test("listens on the correct ports", async () => {
    await sham({ ip: "127.0.0.1", port: 9000 });

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

  test("uses the handlerFactories handler to handle the requests", async () => {
    await sham();

    expect(http.createServer).toHaveBeenCalledWith(handlerFactory.__handler);
  });
});

describe("Setting a default reply", () => {
  test("it should pass the default reply to the handlerFactory", async () => {
    const defaultReply = {
      status: 418,
      headers: { "Content-Type": "text/fancy" },
      body: "Tadaaaa!"
    };
    await sham({ defaultReply });

    expect(handlerFactory).toHaveBeenCalledWith(defaultReply);
  });
  test("it should pass undefined if the default reply is not specified", async () => {
    await sham({ port: 9001 });

    expect(handlerFactory).toHaveBeenCalledWith(undefined);
  });
  test("it should pass undefined if no arguments are specified", async () => {
    await sham();

    expect(handlerFactory).toHaveBeenCalledWith(undefined);
  });
});

describe("Configuring mocked routes", () => {
  let server;
  beforeEach(async () => {
    server = await sham();
  });
  test("it should allow you to mock responses", () => {
    const matcher = () => true;
    const mock = {
      status: 200,
      headers: {
        "Content-Type": "text/plain"
      },
      body: "Test"
    };
    server.when(matcher, mock);

    expect(handlerFactory.__handler.matchers).toContainEqual({
      matcher,
      mock,
      calls: []
    });
  });

  test("it should return the matcherItem", () => {
    const matcher = () => true;
    const mock = {
      status: 200,
      headers: {
        "Content-Type": "text/plain"
      },
      body: "Test"
    };

    const result = server.when(matcher, mock);

    expect(result).toEqual({
      matcher,
      mock,
      calls: []
    });
  });

  test("it should throw an error if you do not specify a matcher", () => {
    expect(() => server.when()).toThrow(
      new Error("'matcher' argument is required")
    );
  });

  test("it should throw an error if you do not specify a mock", () => {
    expect(() => server.when(() => true)).toThrow(
      new Error("'mock' argument is required")
    );
  });

  test("it should add new matchers to the top of the list", () => {
    const matcherA = jest.fn(() => true);
    const matcherB = jest.fn(() => true);
    const matcherC = jest.fn(() => true);
    server.when(matcherA, { body: { a: 1 } });
    server.when(matcherB, { body: { b: 2 } });
    server.when(matcherC, { body: { c: 3 } });

    expect(handlerFactory.__handler.matchers).toEqual([
      { matcher: matcherC, mock: expect.any(Object), calls: [] },
      { matcher: matcherB, mock: expect.any(Object), calls: [] },
      { matcher: matcherA, mock: expect.any(Object), calls: [] }
    ]);
  });

  test("it should allow you to set the number of times the matcher can be matched", () => {
    const matcher = jest.fn(() => true);
    const mock = { body: { a: 1 } };
    server.when(matcher, mock, 1);

    expect(handlerFactory.__handler.matchers).toEqual([
      {
        matcher,
        mock,
        calls: [],
        times: 1
      }
    ]);
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

describe("Call List", () => {
  let server;

  beforeEach(async () => {
    server = await sham();
  });

  test("it should track all the calls the sham server receives", () => {
    let requestA, requestB, requestC;
    handlerFactory.__handler.calls.push(
      (requestA = { req: {}, matched: { mock: { body: "A" } } })
    );
    handlerFactory.__handler.calls.push(
      (requestB = { req: {}, matched: { mock: { body: "B" } } })
    );
    handlerFactory.__handler.calls.push(
      (requestC = { req: {}, matched: { mock: { body: "C" } } })
    );

    expect(server.calls).toEqual([requestA, requestB, requestC]);
  });
});

describe("Triggering a reset", () => {
  let server;
  beforeEach(async () => {
    server = await sham();
  });

  test("it should not check matchers if they have been reset", () => {
    const matcherA = jest.fn(() => true);
    const matcherB = jest.fn(() => true);
    const matcherC = jest.fn(() => true);
    server.when(matcherA, { body: { a: 1 } });
    server.when(matcherB, { body: { b: 2 } });
    server.when(matcherC, { body: { c: 3 } });

    expect(handlerFactory.__handler.matchers).toHaveLength(3);

    server.reset();

    expect(handlerFactory.__handler.matchers).toHaveLength(0);
  });

  test("it should reset the calls the sham server has received", () => {
    handlerFactory.__handler.calls.push({});
    handlerFactory.__handler.calls.push({});
    handlerFactory.__handler.calls.push({});

    expect(handlerFactory.__handler.calls).toHaveLength(3);

    server.reset();

    expect(handlerFactory.__handler.calls).toHaveLength(0);
  });
});
