const traverse = require("./traverse");

module.exports = function lessThanOrEquals(request, prop, value) {
  return traverse(request, prop) <= value;
};
