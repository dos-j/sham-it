const traverse = require("./traverse");

module.exports = function greaterThanOrEquals(request, prop, value) {
  return traverse(request, prop) >= value;
};
