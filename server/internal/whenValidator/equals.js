const traverse = require("./traverse");

module.exports = function equals(request, prop, value) {
  return traverse(request, prop) == value;
};
