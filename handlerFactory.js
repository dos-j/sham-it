const url = require("url");

function handlerFactory(defaultReply = {}) {
  const matchers = [];
  const calls = [];

  function toDto(item) {
    const $matcher = {
      id: item.id,
      when: item.matcher.toString(),
      respond: item.mock
    };

    if (item.hasOwnProperty("times")) {
      $matcher.times = item.times;
    }

    return $matcher;
  }

  function resetHandler() {
    matchers.length = 0;
    calls.length = 0;

    return {
      status: 204,
      headers: {},
      body: undefined
    };
  }

  function getAllMatchersHandler() {
    return {
      body: matchers.map(toDto)
    };
  }

  const handler = (req, res) => {
    function reply(
      { status = 200, headers = { "Content-Type": "application/json" }, body }
    ) {
      res.writeHead(status, headers);

      if (body && typeof body === "object") {
        res.end(JSON.stringify(body));
      } else if (typeof body === "undefined") {
        res.end();
      } else {
        res.end(body);
      }
    }
    const requestUrl = url.parse(req.url);
    if (req.method === "POST" && requestUrl.pathname === "/$reset") {
      return reply(resetHandler());
    }

    if (req.method === "GET" && requestUrl.pathname === "/$matchers") {
      return reply(getAllMatchersHandler());
    }

    if (req.method === "GET" && requestUrl.pathname.startsWith("/$matchers/")) {
      const matcherId = requestUrl.pathname.substr("/$matchers/".length);

      let matcher;
      if ((matcher = matchers.find(matcher => `${matcher.id}` === matcherId))) {
        return reply({
          body: toDto(matcher)
        });
      }

      return reply({
        status: 404,
        headers: { "Content-Type": "text/plain" },
        body: `Matcher with Id '${matcherId}' could not be found`
      });
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

          reply({
            status,
            headers,
            body
          });

          matcherItem.calls.push({ request: req });

          return;
        }
      }

      reply({
        status: defaultReply.status || 404,
        headers: defaultReply.headers || { "Content-Type": "text/plain" },
        body: defaultReply.body || "Not Found"
      });
    } catch (ex) {
      console.error(`Critical Error: ${ex}`, ex);

      call.source = matcherItem;
      call.error = ex;

      matcherItem.errors = matcherItem.errors || [];
      matcherItem.errors.push({ request: req, error: ex });

      reply({
        status: 500,
        headers: { "Content-Type": "text/plain" },
        body: "Internal Server Error"
      });
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
