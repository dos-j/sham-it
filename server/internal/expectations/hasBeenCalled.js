module.exports = requestStore =>
  () => {
    if (requestStore.length > 0) {
      return {
        status: 204
      };
    }

    return {
      status: 417,
      body: "Expected sham to have been called."
    };
  };
