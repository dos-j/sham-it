module.exports = function healthcheckHandler() {
  return () => ({ status: 200, body: "Success" });
};
