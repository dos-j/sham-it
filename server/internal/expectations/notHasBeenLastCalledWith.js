const stringifyRequest = require("./stringifyRequest");
const indent = require("indent-string");
const tryMatch = require("../tryMatchRequest");

module.exports = requestStore =>
  query => {
    const lastRequest = requestStore[requestStore.length - 1];
    const match = lastRequest && tryMatch(lastRequest, query);
    if (!match) {
      return {
        status: 204
      };
    }

    return {
      status: 417,
      body: `Expected sham not to have been last called with:\n${indent(JSON.stringify(query, null, 2), 2)}\nBut it was last called with:${indent(stringifyRequest(lastRequest), 2)}`
    };
  };
