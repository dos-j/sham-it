const logger = {
  info() {},
  error() {},
  warn() {},
  debug() {},
  trace() {},
  child() {
    return logger;
  }
};

module.exports = logger;
