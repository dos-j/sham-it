const portfinder = require("portfinder");
const http = require("http");
const handlerFactory = require("./handlerFactory");
const required = name => {
  throw new Error(`'${name}' argument is required`);
};

async function shamFactory({ ip = "0.0.0.0", port, defaultReply } = {}) {
  if (!port) {
    port = await portfinder.getPortPromise();
  }

  const handler = handlerFactory(defaultReply);

  const server = http.createServer(handler);

  server.listen(port, ip);

  function close() {
    return server.close();
  }

  function reset() {
    handler.matchers.length = 0;
    handler.calls.length = 0;
  }

  function when(matcher = required("matcher"), mock = required("mock"), times) {
    const item = { matcher, mock, calls: [] };

    if (typeof times !== "undefined") {
      if (!(+times >= 1)) {
        throw new Error(
          `${times} is not a valid number of times this matcher can match`
        );
      }

      item.times = +times;
    }

    handler.matchers.unshift(item);

    return item;
  }

  return {
    port,
    ip,
    close,
    when,
    reset,
    get listening() {
      return server.listening;
    },
    get calls() {
      return handler.calls;
    }
  };
}

module.exports = shamFactory;
