const fetch = require("node-fetch");

const whenHelpers = {
  and: (...values) => ({ op: "AND", values }),
  or: (...values) => ({ op: "OR", values }),
  not: value => ({ op: "!", value }),
  equals: (prop, value) => ({ op: "==", prop, value }),
  greaterThan: (prop, value) => ({ op: ">", prop, value }),
  greaterThanOrEquals: (prop, value) => ({ op: ">=", prop, value }),
  lessThan: (prop, value) => ({ op: "<", prop, value }),
  lessThanOrEquals: (prop, value) => ({ op: "<=", prop, value }),
  regex: (prop, regex) => ({
    op: "REGEX",
    prop,
    value: [regex.source, regex.flags]
  })
};

const whenBuilder = buildFunc => buildFunc(whenHelpers);

module.exports = function shamClient({ port, https = false }) {
  const baseUri = `${(https && "https") || "http"}://localhost:${port}`;

  return {
    uri: baseUri,
    whenBuilder,
    async addMatcher(matcher) {
      if (matcher && typeof matcher.when === "function") {
        matcher = Object.assign({}, matcher, {
          when: matcher.when(whenHelpers)
        });
      }

      const res = await fetch(`${baseUri}/$matchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: matcher ? JSON.stringify(matcher) : ""
      });

      if (res.status < 200 || res.status > 299) {
        const error = new Error(`Error creating matcher: ${await res.text()}`);
        error.statusCode = res.status;

        throw error;
      }

      return await res.json();
    },
    async getMatcher(id) {
      const res = await fetch(`${baseUri}/$matchers/${id}`);

      if (res.status < 200 || res.status > 299) {
        const error = new Error(
          `Error retrieving matcher: ${await res.text()}`
        );
        error.statusCode = res.status;

        throw error;
      }

      return await res.json();
    },
    async getMatchers() {
      const res = await fetch(`${baseUri}/$matchers`);

      if (res.status < 200 || res.status > 299) {
        const error = new Error(
          `Error retrieving matchers: ${await res.text()}`
        );
        error.statusCode = res.status;

        throw error;
      }

      return await res.json();
    },
    async deleteMatcher(id) {
      const res = await fetch(`${baseUri}/$matchers/${id}`, {
        method: "DELETE"
      });

      if (res.status < 200 || res.status > 299) {
        const error = new Error(`Error deleting matcher: ${await res.text()}`);
        error.statusCode = res.status;

        throw error;
      }
    },
    async getRequests() {
      const res = await fetch(`${baseUri}/$requests`);

      if (res.status < 200 || res.status > 299) {
        const error = new Error(
          `Error retrieving requests: ${await res.text()}`
        );
        error.statusCode = res.status;

        throw error;
      }

      return await res.json();
    },
    async reset() {
      const res = await fetch(`${baseUri}/$reset`, {
        method: "POST"
      });

      if (res.status < 200 || res.status > 299) {
        const error = new Error(
          `Error resetting matchers and requests: ${await res.text()}`
        );
        error.statusCode = res.status;

        throw error;
      }
    },
    async close() {
      const res = await fetch(`${baseUri}/$shutdown`, {
        method: "POST"
      });

      if (res.status < 200 || res.status > 299) {
        const error = new Error(
          `Error shutting down the sham: ${await res.text()}`
        );
        error.statusCode = res.status;

        throw error;
      }
    },
    async hasBeenCalled() {
      const res = await fetch(`${baseUri}/$hasbeencalled`, { method: "POST" });

      if (res.status < 200 || res.status > 299) {
        const error = new Error(`${await res.text()}`);
        error.statusCode = res.status;

        throw error;
      }

      return true;
    },
    async hasBeenCalledTimes(number) {
      const res = await fetch(`${baseUri}/$hasbeencalledtimes`, {
        method: "POST",
        body: `${number}`
      });

      if (res.status < 200 || res.status > 299) {
        const error = new Error(`${await res.text()}`);
        error.statusCode = res.status;

        throw error;
      }

      return true;
    },
    async hasBeenLastCalledWith(queryBuilder) {
      let query;
      if (typeof queryBuilder === "function") {
        query = queryBuilder(whenHelpers);
      } else {
        query = queryBuilder;
      }

      const res = await fetch(`${baseUri}/$hasbeenlastcalledwith`, {
        method: "POST",
        body: JSON.stringify(query)
      });

      if (res.status < 200 || res.status > 299) {
        const error = new Error(`${await res.text()}`);
        error.statusCode = res.status;

        throw error;
      }

      return true;
    },
    async hasBeenCalledWith(queryBuilder) {
      let query;
      if (typeof queryBuilder === "function") {
        query = queryBuilder(whenHelpers);
      } else {
        query = queryBuilder;
      }

      const res = await fetch(`${baseUri}/$hasbeencalledwith`, {
        method: "POST",
        body: JSON.stringify(query)
      });

      if (res.status < 200 || res.status > 299) {
        const error = new Error(`${await res.text()}`);
        error.statusCode = res.status;

        throw error;
      }

      return true;
    },
    not: {
      async hasBeenCalled() {
        const res = await fetch(`${baseUri}/$not/hasbeencalled`, {
          method: "POST"
        });

        if (res.status < 200 || res.status > 299) {
          const error = new Error(`${await res.text()}`);
          error.statusCode = res.status;

          throw error;
        }

        return true;
      },
      async hasBeenCalledTimes(number) {
        const res = await fetch(`${baseUri}/$not/hasbeencalledtimes`, {
          method: "POST",
          body: `${number}`
        });

        if (res.status < 200 || res.status > 299) {
          const error = new Error(`${await res.text()}`);
          error.statusCode = res.status;

          throw error;
        }

        return true;
      },
      async hasBeenCalledWith(queryBuilder) {
        let query;
        if (typeof queryBuilder === "function") {
          query = queryBuilder(whenHelpers);
        } else {
          query = queryBuilder;
        }

        const res = await fetch(`${baseUri}/$not/hasbeencalledwith`, {
          method: "POST",
          body: JSON.stringify(query)
        });

        if (res.status < 200 || res.status > 299) {
          const error = new Error(`${await res.text()}`);
          error.statusCode = res.status;

          throw error;
        }

        return true;
      },
      async hasBeenLastCalledWith(queryBuilder) {
        let query;
        if (typeof queryBuilder === "function") {
          query = queryBuilder(whenHelpers);
        } else {
          query = queryBuilder;
        }

        const res = await fetch(`${baseUri}/$not/hasbeenlastcalledwith`, {
          method: "POST",
          body: JSON.stringify(query)
        });

        if (res.status < 200 || res.status > 299) {
          const error = new Error(`${await res.text()}`);
          error.statusCode = res.status;

          throw error;
        }

        return true;
      }
    }
  };
};
