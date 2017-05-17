const traverse = require("./traverse");

module.exports = function regex(request, prop, [source, flags = ""]) {
  const r = new RegExp(source, flags);
  return r.test(traverse(request, prop));
};
