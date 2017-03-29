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
    handler({ url: "http://sham/test" }, res);

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

    handler({ url: "http://sham/test" }, res);

    expect(res.writeHead).toHaveBeenCalledWith(418, {
      "Content-Type": "text/fancy"
    });
    expect(res.end).toHaveBeenCalledWith("Tadaaaa!");
  });

  test("it should automatically stringify the body of the default reply", () => {
    handler = handlerFactory({
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { not: "matched" }
    });

    handler({ url: "http://sham/test" }, res);

    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ not: "matched" }));
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

    handler({ url: "http://sham/test" }, res);

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

    handler({ url: "http://sham/test" }, res);

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

    handler({ url: "http://sham/test" }, res);

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

    handler({ url: "http://sham/test" }, res);

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

    handler({ url: "http://sham/test" }, res);

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

    handler({ url: "http://sham/test" }, res);

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

    const req = { url: "http://sham/test" };
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

    handler({ url: "http://sham/test" }, res);

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

    handler({ url: "http://sham/test" }, res);

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

    handler({ url: "http://sham/test" }, res);

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

      handler({ url: "http://sham/test" }, res);

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

    handler({ url: "http://sham/test" }, res);

    expect(res.end).lastCalledWith("Test");

    handler({ url: "http://sham/test" }, res);

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

    handler({ url: "http://sham/test" }, res);

    expect(res.end).lastCalledWith("Test");

    handler({ url: "http://sham/test" }, res);

    expect(res.end).lastCalledWith("Test");

    handler({ url: "http://sham/test" }, res);

    expect(res.end).lastCalledWith("Not Found");
  });
});

describe("Call list", () => {
  test("it should log each call to the handler", () => {
    expect(handler.calls).toHaveLength(0);

    handler({ url: "http://sham/test" }, res);

    expect(handler.calls).toHaveLength(1);

    handler({ url: "http://sham/test" }, res);
    handler({ url: "http://sham/test" }, res);

    expect(handler.calls).toHaveLength(3);
  });

  test("it should include the request in the call", () => {
    const req = { url: "http://sham/a/b/c" };
    handler(req, res);

    expect(handler.calls).toContainEqual(
      expect.objectContaining({ request: req })
    );
  });

  test("it should not included a matched object if there were no matches", () => {
    const req = { url: "http://sham/a/b/c" };
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

    const req = { url: "http://sham/a/b/c" };
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

      const req = { url: "http://sham/a/b/c" };
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

    const req = { url: "http://sham/a/b/c" };
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

      const req = { url: "http://sham/a/b/c" };
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

      const req = { url: "http://sham/a/b/c" };
      handler(req, res);
      handler(req, res);

      expect(matcherItem.errors).toHaveLength(2);
    } finally {
      spy.mockRestore();
    }
  });
});

describe("HTTP API", () => {
  describe("POST /$reset", () => {
    let matcher;
    beforeEach(() => {
      matcher = jest.fn();

      handler.matchers.unshift({ matcher, calls: [] });
      handler.matchers.unshift({ matcher, calls: [] });
      handler.matchers.unshift({ matcher, calls: [] });

      handler.calls.push({});
      handler.calls.push({});
      handler.calls.push({});
      handler.calls.push({});
      handler.calls.push({});
    });

    test("it should clear all of the matchers", () => {
      expect(handler.matchers).toHaveLength(3);

      handler({ method: "POST", url: "/$reset" }, res);

      expect(handler.matchers).toHaveLength(0);
    });

    test("it should clear all of the logged calls", () => {
      expect(handler.calls).toHaveLength(5);

      handler({ method: "POST", url: "/$reset" }, res);

      expect(handler.calls).toHaveLength(0);
    });

    test("it should not call any matchers", () => {
      handler({ url: "http://sham/test" }, res);

      expect(matcher).toHaveBeenCalled();
      matcher.mockClear();

      handler({ method: "POST", url: "/$reset" }, res);

      expect(matcher).not.toHaveBeenCalled();
    });

    test("it should respond with 204 No Content", () => {
      handler({ method: "POST", url: "http://sham/$reset" }, res);

      expect(res.writeHead).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalledWith();
    });

    test("it should only respond with 204 No Content if the method is POST", () => {
      handler({ method: "GET", url: "http://sham/$reset" }, res);

      expect(res.writeHead).not.toHaveBeenCalledWith(204);
      expect(res.end).not.toHaveBeenCalledWith();
    });
  });
});
