module.exports = function shutdown(server) {
  return () => {
    server.close();

    return { status: 204 };
  };
};
