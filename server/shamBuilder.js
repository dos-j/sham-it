const reply = require("./reply");
const parse = require("./requestParser");
const createRouteStore = require("./createRouteStore");
const serializeError = require("serialize-error");

module.exports = function shamBuilder(server, defaultReply) {
  const matcherStore = [];
  const requestStore = [];
  const routeStore = createRouteStore(
    server,
    matcherStore,
    requestStore,
    defaultReply
  );

  return async (req, res) => {
    let request;
    try {
      request = await parse(req);

      reply(
        res,
        routeStore.reduce((prev, route) => prev || route(request), undefined)
      );
    } catch (error) {
      console.error(error);
      const response = {
        status: 500,
        body: "Internal Server Error"
      };
      requestStore.push({
        request,
        error: serializeError(error),
        response
      });

      reply(res, response);
    }
  };
};
