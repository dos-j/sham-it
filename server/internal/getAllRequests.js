module.exports = function getAllRequestsHandler(requestStore) {
  return () => ({
    status: 200,
    body: requestStore
  });
};
