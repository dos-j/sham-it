const serverCreator = require("./server/serverCreator");
const shamBuilder = require("./server/shamBuilder");
const shamClient = require("./client/shamClient");
const pino = require("pino");

function createLogger() {
  return pino();
}

module.exports = function shamIt(
  { port = 0, https, defaultReply, logger = createLogger() } = {}
) {
  return new Promise(async (resolve, reject) => {
    try {
      const server = serverCreator(https);
      const sham = shamBuilder(server, defaultReply, logger);

      server.on("request", sham);
      server.on("listening", () => {
        resolve(
          new shamClient({ port: server.address().port, https: !!https })
        );
      });

      server.listen(port);
    } catch (ex) {
      reject(ex);
    }
  });
};
