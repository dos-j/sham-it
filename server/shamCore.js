const shortid = require("shortid");

function getAllRequestsHandler(requestStore) {
  return () => ({
    status: 200,
    body: requestStore
  });
}

function getAllMatchersHandler(matcherStore) {
  return () => ({
    status: 200,
    body: matcherStore
  });
}

function getSingleMatcherHandler(matcherStore) {
  return id => {
    let matcher;
    if ((matcher = matcherStore.find(matcher => matcher.id === id))) {
      return {
        status: 200,
        body: matcher
      };
    }
    return {
      status: 404,
      body: "Not Found"
    };
  };
}

function createMatcherHandler(matcherStore) {
  return matcher => {
    if (!matcher || typeof matcher !== "object") {
      return { status: 400, body: "The matcher definition must be an object" };
    }
    if (!matcher.when || typeof matcher.when !== "object") {
      return {
        status: 400,
        body: "The matcher must contain a valid when property"
      };
    }
    if (!matcher.respond || typeof matcher.respond !== "object") {
      return {
        status: 400,
        body: "The matcher must contain a valid respond property"
      };
    }

    const created = Object.assign(
      {
        id: shortid.generate()
      },
      matcher
    );
    matcherStore.unshift(created);

    return {
      status: 200,
      body: created
    };
  };
}

function deleteMatcherHandler(matcherStore) {
  return id => {
    let index;
    if ((index = matcherStore.findIndex(matcher => matcher.id === id)) >= 0) {
      matcherStore.splice(index, 1);
    }
    return {
      status: 204
    };
  };
}

function resetHandler(matcherStore, requestStore) {
  return () => {
    matcherStore.length = 0;
    requestStore.length = 0;

    return { status: 204 };
  };
}

function shutdownHandler(server) {
  return () => {
    server.close();

    return { status: 204 };
  };
}

module.exports = {
  getAllRequestsHandler,
  getAllMatchersHandler,
  getSingleMatcherHandler,
  createMatcherHandler,
  deleteMatcherHandler,
  resetHandler,
  shutdownHandler
};
