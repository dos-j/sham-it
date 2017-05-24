const serverCreator = require("../server/serverCreator");
const shamBuilder = require("../server/shamBuilder");

const testLogger = require("./logger");

module.exports = async function createTestServer(
  { defaultReply, logger = testLogger } = {}
) {
  const server = await serverCreator(server =>
    shamBuilder(server, defaultReply, logger.child())
  );
  return server.address().port;
};
