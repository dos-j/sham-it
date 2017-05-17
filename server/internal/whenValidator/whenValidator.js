const and = require("./and");
const or = require("./or");
const equals = require("./equals");
const not = require("./not");
const greaterThan = require("./greaterThan");
const greaterThanOrEquals = require("./greaterThanOrEquals");
const lessThan = require("./lessThan");
const lessThanOrEquals = require("./lessThanOrEquals");
const regex = require("./regex");

module.exports = function whenValidator(request, when) {
  const validate = when => whenValidator(request, when);
  switch (when.op) {
    case "AND":
      return and(validate, when.values);
    case "OR":
      return or(validate, when.values);
    case "==":
      return equals(request, when.prop, when.value);
    case "!":
      return not(validate, when.value);
    case ">":
      return greaterThan(request, when.prop, when.value);
    case ">=":
      return greaterThanOrEquals(request, when.prop, when.value);
    case "<":
      return lessThan(request, when.prop, when.value);
    case "<=":
      return lessThanOrEquals(request, when.prop, when.value);
    case "REGEX":
      return regex(request, when.prop, when.value);
  }
};
