const stringifyRequest = require("./stringifyRequest");
const indent = require("indent-string");

module.exports = requestStore =>
  () => {
    if (requestStore.length === 0) {
      return {
        status: 204
      };
    }

    return {
      status: 417,
      body: `Expected sham not to be called but it was called with:${requestStore.map(
        (...args) => indent(stringifyRequest(...args), 2)
      )}`
    };
  };
