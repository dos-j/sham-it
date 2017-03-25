function handlerFactory(defaultReply = {}) {
  let matchers = [];

  const handler = (req, res) => {
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
  };

  return Object.defineProperties(handler, {
    matchers: {
      enumerable: true,
      get() {
        return matchers;
      }
    }
  });
}

module.exports = handlerFactory;
