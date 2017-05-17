const serverCreator = require("./server/serverCreator");
const shamBuilder = require("./server/shamBuilder");
const shamClient = require("./client/shamClient");

module.exports = function shamIt({ port = 0, https, defaultReply } = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      const server = serverCreator(https);
      const sham = shamBuilder(server, defaultReply);

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
