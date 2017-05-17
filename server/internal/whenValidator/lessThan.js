const traverse = require("./traverse");

module.exports = function lessThan(request, prop, value) {
  return traverse(request, prop) < value;
};
