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
  let lastUniqueId = 0;

  const server = http.createServer(handler);

  server.listen(port, ip);

  function close() {
    return server.close();
  }

  function reset() {
    handler.matchers.length = 0;
    handler.calls.length = 0;
  }

  function when(
    matcher = required("matcher"),
    {
      status = 200,
      headers = { "Content-Type": "application/json" },
      body
    } = required("mock"),
    times
  ) {
    const item = {
      id: ++lastUniqueId,
      matcher,
      mock: { status, headers, body },
      calls: []
    };

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
