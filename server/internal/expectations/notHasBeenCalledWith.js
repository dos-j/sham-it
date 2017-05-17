const stringifyRequest = require("./stringifyRequest");
const indent = require("./indentText");
const tryMatch = require("../tryMatchRequest");

module.exports = requestStore =>
  query => {
    const match = requestStore.reduce(
      (prev, request) => prev || tryMatch(request, query),
      undefined
    );
    if (!match) {
      return {
        status: 204
      };
    }

    return {
      status: 417,
      body: `Expected sham not to have been called with:\n${indent(JSON.stringify(query, null, 2), 2)}\nBut it was called with:${indent(stringifyRequest(match), 2)}`
    };
  };
