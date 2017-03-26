const handlerFactory = require("./handlerFactory");

let res;
let handler;

beforeEach(() => {
  handler = handlerFactory();

  res = {
    writeHead: jest.fn(),
    end: jest.fn()
  };
});

describe("Returning a Default Reply", () => {
  test("it should respond with the default reply if there are no mocked routes", async () => {
    handler({}, res);

    expect(res.writeHead).toHaveBeenCalledWith(404, {
      "Content-Type": "text/plain"
    });
    expect(res.end).toHaveBeenCalledWith("Not Found");
  });

  test("it should allow you to override the default reply", async () => {
    handler = handlerFactory({
      status: 418,
      headers: { "Content-Type": "text/fancy" },
      body: "Tadaaaa!"
    });

    handler({}, res);

    expect(res.writeHead).toHaveBeenCalledWith(418, {
      "Content-Type": "text/fancy"
    });
    expect(res.end).toHaveBeenCalledWith("Tadaaaa!");
  });
});

describe("Configuring mocked routes", () => {
  test("it should allow you to mock responses", () => {
    const mock = {
      status: 200,
      headers: {
        "Content-Type": "text/plain"
      },
      body: "Test"
    };
    handler.matchers.unshift({
      matcher: () => true,
      mock,
      calls: []
    });

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
    handler.matchers.unshift({
      matcher: () => true,
      mock,
      calls: []
    });

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
    handler.matchers.unshift({
      matcher: () => true,
      mock,
      calls: []
    });

    const req = {};
    handler(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(mock.status, {
      "Content-Type": "application/json"
    });

    expect(res.end).toHaveBeenCalledWith(mock.body);
  });

  test("it should handle a bodyless mock", () => {
    handler.matchers.unshift({
      matcher: () => true,
      calls: []
    });

    handler({}, res);

    expect(res.end).toHaveBeenCalledWith(undefined);
  });

  test("it should automatically stringify the body", () => {
    const mock = {
      body: {
        a: 1
      }
    };
    handler.matchers.unshift({
      matcher: () => true,
      mock,
      calls: []
    });

    const req = {};
    handler(req, res);

    expect(res.end).toHaveBeenCalledWith(JSON.stringify(mock.body));
  });

  test("it should not return the mock if the matcher returns false", () => {
    const mock = {
      body: "{}"
    };
    handler.matchers.unshift({
      matcher: () => false,
      mock,
      calls: []
    });

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
    handler.matchers.unshift({
      matcher: matcher,
      mock,
      calls: []
    });

    const req = {};
    handler(req, res);

    expect(matcher).toHaveBeenCalledWith(req);
  });

  test("it should check matchers in reverse order and only check the first matcher if it returns true", () => {
    const matcherA = jest.fn(() => true);
    const matcherB = jest.fn(() => true);
    const matcherC = jest.fn(() => true);
    handler.matchers.unshift({
      matcher: matcherA,
      mock: { body: { a: 1 } },
      calls: []
    });
    handler.matchers.unshift({
      matcher: matcherB,
      mock: { body: { b: 2 } },
      calls: []
    });
    handler.matchers.unshift({
      matcher: matcherC,
      mock: { body: { c: 3 } },
      calls: []
    });

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
    handler.matchers.unshift({
      matcher: matcherA,
      mock: { body: { a: 1 } },
      calls: []
    });
    handler.matchers.unshift({
      matcher: matcherB,
      mock: { body: { b: 2 } },
      calls: []
    });
    handler.matchers.unshift({
      matcher: matcherC,
      mock: { body: { c: 3 } },
      calls: []
    });

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
    handler.matchers.unshift({
      matcher: matcherA,
      mock: { body: { a: 1 } },
      calls: []
    });
    handler.matchers.unshift({
      matcher: matcherB,
      mock: { body: { b: 2 } },
      calls: []
    });
    handler.matchers.unshift({
      matcher: matcherC,
      mock: { body: { c: 3 } },
      calls: []
    });

    const req = {};
    handler(req, res);

    expect(matcherC).toHaveBeenCalled();
    expect(matcherB).toHaveBeenCalled();
    expect(matcherA).not.toHaveBeenCalled();

    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ b: 2 }));
  });

  test("it should gracefully handle errors generated by a matcher", () => {
    const spy = jest.spyOn(console, "error");
    spy.mockImplementation(() => false);
    try {
      const error = new Error("TEST");
      handler.matchers.unshift({
        matcher() {
          throw error;
        },
        calls: []
      });

      handler({}, res);

      expect(res.writeHead).toHaveBeenCalledWith(500, {
        "Content-Type": "text/plain"
      });
      expect(res.end).toHaveBeenCalledWith("Internal Server Error");

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining(`${error}`),
        error
      );
    } finally {
      spy.mockRestore();
    }
  });
});

describe("Mocks that expire", () => {
  test("it should only match once", () => {
    const matcher = jest.fn(() => true);
    handler.matchers.unshift({
      matcher,
      mock: { body: "Test" },
      calls: [],
      times: 1
    });

    const req = {};
    handler(req, res);

    expect(res.end).lastCalledWith("Test");

    handler(req, res);

    expect(res.end).lastCalledWith("Not Found");
  });

  test("it should only match twice", () => {
    const matcher = jest.fn(() => true);
    handler.matchers.unshift({
      matcher,
      mock: { body: "Test" },
      calls: [],
      times: 2
    });

    const req = {};
    handler(req, res);

    expect(res.end).lastCalledWith("Test");

    handler(req, res);

    expect(res.end).lastCalledWith("Test");

    handler(req, res);

    expect(res.end).lastCalledWith("Not Found");
  });
});

describe("Call list", () => {
  test("it should log each call to the handler", () => {
    expect(handler.calls).toHaveLength(0);

    handler({}, res);

    expect(handler.calls).toHaveLength(1);

    handler({}, res);
    handler({}, res);

    expect(handler.calls).toHaveLength(3);
  });

  test("it should include the request in the call", () => {
    const req = { uri: "a/b/c" };
    handler(req, res);

    expect(handler.calls).toContainEqual(
      expect.objectContaining({ request: req })
    );
  });

  test("it should not included a matched object if there were no matches", () => {
    const req = { uri: "a/b/c" };
    handler(req, res);

    expect(handler.calls).not.toContainEqual(
      expect.objectContaining({ matched: expect.any(Object) })
    );
  });

  test("it should include the matched object if there were matches", () => {
    handler.matchers.unshift({
      matcher: () => true,
      mock: { body: "TEST" },
      calls: []
    });

    const req = { uri: "a/b/c" };
    handler(req, res);

    expect(handler.calls).toContainEqual(
      expect.objectContaining({ matched: expect.any(Object) })
    );
  });

  test("it should record the error if the matcher throws one", () => {
    const spy = jest.spyOn(console, "error");
    spy.mockImplementation(() => false);
    try {
      const error = new Error("TEST");
      const matcherItem = {
        matcher() {
          throw error;
        },
        calls: []
      };
      handler.matchers.unshift(matcherItem);

      const req = { uri: "a/b/c" };
      handler(req, res);

      expect(handler.calls).toContainEqual(
        expect.objectContaining({ request: req, error, source: matcherItem })
      );
    } finally {
      spy.mockRestore();
    }
  });

  test("it should add the call to the matcher", () => {
    const matcherItem = {
      matcher: () => true,
      mock: { body: "Test" },
      calls: []
    };
    handler.matchers.unshift(matcherItem);

    const req = { uri: "a/b/c" };
    handler(req, res);

    expect(matcherItem.calls).toContainEqual(
      expect.objectContaining({ request: req })
    );
  });

  test("it should add an error to the matcher if there was an error", () => {
    const spy = jest.spyOn(console, "error");
    spy.mockImplementation(() => false);
    try {
      const error = new Error("TEST");
      const matcherItem = {
        matcher() {
          throw error;
        },
        calls: []
      };
      handler.matchers.unshift(matcherItem);

      const req = { uri: "a/b/c" };
      handler(req, res);

      expect(matcherItem.errors).toContainEqual(
        expect.objectContaining({ request: req, error })
      );
    } finally {
      spy.mockRestore();
    }
  });

  test("it should add multiple errors to the matcher if there was an error", () => {
    const spy = jest.spyOn(console, "error");
    spy.mockImplementation(() => false);
    try {
      const error = new Error("TEST");
      const matcherItem = {
        matcher() {
          throw error;
        },
        calls: []
      };
      handler.matchers.unshift(matcherItem);

      const req = { uri: "a/b/c" };
      handler(req, res);
      handler(req, res);

      expect(matcherItem.errors).toHaveLength(2);
    } finally {
      spy.mockRestore();
    }
  });
});
