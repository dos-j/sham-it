module.exports = function internalRoute(method, regex, handler) {
  return request => {
    let match;

    if (request.method === method && (match = request.pathname.match(regex))) {
      const [, ...args] = match;
      return handler(...args, request.body);
    }
  };
};
