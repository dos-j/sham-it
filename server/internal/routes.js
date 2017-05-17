const registerExpectations = require("./expectations/routes");

module.exports = (...args) => [...registerExpectations(...args)];
