const serverCreator = require("./server/serverCreator");
const shamBuilder = require("./server/shamBuilder");
const shamClient = require("./client/shamClient");
const pino = require("pino");

module.exports = async function shamIt(
  { port = 0, https, defaultReply, logger = pino() } = {}
) {
  const server = await serverCreator(
    server => shamBuilder(server, defaultReply, logger),
    { port, https }
  );

  port = server.address().port;
  logger.info(`Sham-It is listening to requests on port ${port}`, {
    port,
    https: !!https
  });

  return new shamClient({ port, https: !!https });
};
