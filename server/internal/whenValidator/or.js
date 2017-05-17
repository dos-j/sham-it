module.exports = function or(validate, values) {
  return values.reduce((prev, nextWhen) => prev || validate(nextWhen), false);
};
