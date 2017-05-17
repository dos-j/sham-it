module.exports = function and(validate, values) {
  return values.reduce((prev, nextWhen) => prev && validate(nextWhen), true);
};
