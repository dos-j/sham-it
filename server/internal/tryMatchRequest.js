const whenValidator = require("./whenValidator/whenValidator");

module.exports = function tryMatchRequest(request, query) {
  if (whenValidator(request.request, query)) {
    return request;
  }

  return undefined;
};
