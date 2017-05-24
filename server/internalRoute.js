module.exports = function internalRoute(method, regex, handler) {
  return (request, logger) => {
    let match;

    if (request.method === method && (match = request.pathname.match(regex))) {
      const [, ...args] = match;
      logger.info("Routing to internal handler", { regex, args });

      return handler(...args, request.body);
    }
  };
};
