const portfinder = require("portfinder");
const http = require("http");
const handlerFactory = require("./handlerFactory");

async function sham({ ip = "0.0.0.0", port, defaultReply } = {}) {
  if (!port) {
    port = await portfinder.getPortPromise();
  }

  const handler = handlerFactory(defaultReply);

  const server = http.createServer(handler);

  server.listen(port, ip);

  return Object.defineProperties(
    {
      port,
      ip,
      close() {
        return server.close();
      },
      when(matcher, mock, times) {
        const item = { matcher, mock };

        if (typeof times !== "undefined") {
          if (!(+times >= 1)) {
            throw new Error(
              `${times} is not a valid number of times this matcher can match`
            );
          }

          item.times = +times;
        }

        handler.matchers.unshift(item);
      },
      reset() {
        handler.matchers.length = 0;
      }
    },
    {
      listening: {
        enumerable: true,
        get() {
          return server.listening;
        }
      }
    }
  );
}

module.exports = sham;
