const traverse = require("./traverse");

module.exports = function greaterThan(request, prop, value) {
  return traverse(request, prop) > value;
};
