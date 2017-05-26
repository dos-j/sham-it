const shortid = require("shortid");

module.exports = function createMatcherHandler(matcherStore) {
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
};
