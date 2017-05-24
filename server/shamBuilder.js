const reply = require("./reply");
const parse = require("./requestParser");
const createRouteStore = require("./createRouteStore");
const serializeError = require("serialize-error");
const shortid = require("shortid");

module.exports = function shamBuilder(server, defaultReply, logger) {
  const matcherStore = [];
  const requestStore = [];
  const routeStore = createRouteStore(
    server,
    matcherStore,
    requestStore,
    defaultReply
  );

  return async (req, res) => {
    logger = logger.child({ reqId: shortid.generate() });
    const log = logger.child({ src: "server/shamBuilder.js" });
    logger.trace("Request received");

    let request;
    try {
      request = await parse(req);
      log.info("Request received", { request });

      const response = routeStore.reduce(
        (prev, route) => prev || route(request, logger),
        undefined
      );

      reply(res, response);

      log.info("Response sent", { response });
    } catch (error) {
      logger.error("Critical error", { error });
      const response = {
        status: 500,
        body: "Internal Server Error"
      };
      reply(res, response);

      log.info("Response sent", { response });

      requestStore.push({
        request,
        error: serializeError(error),
        response
      });
    }
  };
};
