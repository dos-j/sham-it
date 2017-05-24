module.exports = function defaultRoute(defaultReply, requestStore) {
  return (request, logger) => {
    logger.info("Routing to default handler", { defaultReply });

    const response = defaultReply || {
      status: 404,
      body: "Not Found"
    };

    requestStore.push({ request, response });

    return response;
  };
};
