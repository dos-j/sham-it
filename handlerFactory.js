const url = require("url");

function handlerFactory(defaultReply = {}) {
  const matchers = [];
  const calls = [];

  const handler = (req, res) => {
    const requestUrl = url.parse(req.url);
    if (req.method === "POST" && requestUrl.pathname === "/$reset") {
      matchers.length = 0;
      calls.length = 0;

      res.writeHead(204);
      return res.end();
    }

    if (req.method === "GET" && requestUrl.pathname === "/$matchers") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify(
          matchers.map(item => {
            const $matcher = {
              id: item.id,
              when: item.matcher.toString(),
              respond: item.mock
            };

            if (item.hasOwnProperty("times")) {
              $matcher.times = item.times;
            }

            return $matcher;
          })
        )
      );
    }

    const call = { request: req };
    let matcherItem;
    try {
      for (matcherItem of matchers.filter(
        matcherItem =>
          !matcherItem.hasOwnProperty("times") || matcherItem.times > 0
      )) {
        const {
          matcher,
          mock: {
            status,
            headers,
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

          matcherItem.calls.push({ request: req });

          return;
        }
      }

      res.writeHead(
        defaultReply.status || 404,
        defaultReply.headers || { "Content-Type": "text/plain" }
      );

      const defaultBody = defaultReply.body || "Not Found";
      if (defaultBody && typeof defaultBody === "object") {
        res.end(JSON.stringify(defaultBody));
      } else {
        res.end(defaultBody);
      }
    } catch (ex) {
      console.error(`Critical Error: ${ex}`, ex);

      call.source = matcherItem;
      call.error = ex;

      matcherItem.errors = matcherItem.errors || [];
      matcherItem.errors.push({ request: req, error: ex });

      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    } finally {
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
