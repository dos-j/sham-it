function handlerFactory(defaultReply = {}) {
  let matchers = [];
  const calls = [];

  const handler = (req, res) => {
    const call = { request: req };
    let matcherItem;
    try {
      for (matcherItem of matchers) {
        const {
          matcher,
          mock: {
            status = 200,
            headers = { "Content-Type": "application/json" },
            body
          } = {}
        } = matcherItem;
        if (matcher(req)) {
          call.matched = matcherItem;

          if (matcherItem.hasOwnProperty("times")) {
            matcherItem.times--;
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

      call.source = matcherItem;
      call.error = ex;

      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    } finally {
      matchers = matchers.filter(({ times }) => times !== 0);
      calls.push(call);
    }
  };

  return Object.defineProperties(handler, {
    matchers: {
      enumerable: true,
      get() {
        return matchers;
      }
    },
    calls: {
      enumerable: true,
      get() {
        return calls;
      }
    }
  });
}

module.exports = handlerFactory;
