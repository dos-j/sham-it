const stringifyRequest = require("./stringifyRequest");
const indent = require("./indentText");

module.exports = requestStore =>
  times => {
    if (requestStore.length === +times) {
      return {
        status: 204
      };
    }

    return {
      status: 417,
      body: `Expected sham to have been called ${times} times, but it was called ${requestStore.length} times:${requestStore.map(
        (...args) => indent(stringifyRequest(...args), 2)
      )}`
    };
  };
