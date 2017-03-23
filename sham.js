const portfinder = require("portfinder");
const http = require("http");

async function sham({ ip = "0.0.0.0", port, defaultReply = {} } = {}) {
  if (!port) {
    port = await portfinder.getPortPromise();
  }

  let matchers = [];

  const server = http.createServer((req, res) => {
    try {
      for (const item of matchers) {
        const {
          matcher,
          mock: {
            status = 200,
            headers = { "Content-Type": "application/json" },
            body
          } = {}
        } = item;
        if (matcher(req)) {
          if (item.hasOwnProperty("times")) {
            item.times--;
          }

          res.writeHead(status, headers);

          if (body && typeof body === "object") {
            res.end(JSON.stringify(body));
          } else {
            res.end(body);
          }

          return;
        }
      }

      res.writeHead(
        defaultReply.status || 404,
        defaultReply.headers || { "Content-Type": "text/plain" }
      );
      res.end(defaultReply.body || "Not Found");
    } catch (ex) {
      console.error(`Critical Error: ${ex}`, ex);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    } finally {
      matchers = matchers.filter(({ times }) => times !== 0);
    }
  });

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

        matchers.unshift(item);
      },
      reset() {
        matchers.length = 0;
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
