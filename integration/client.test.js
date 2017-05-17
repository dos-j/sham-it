const shamIt = require("sham-it");
const fetch = require("node-fetch");

describe("integration: client", () => {
  let sham;

  beforeAll(async () => {
    sham = await shamIt();
  });
  afterEach(async () => {
    await sham.reset();
  });
  afterAll(async () => {
    await sham.close();
  });

  describe("Returning the default reply", () => {
    let customSham;
    let defaultReply;

    beforeAll(async () => {
      defaultReply = { status: 400, body: { default: "Reply" } };
      customSham = await shamIt({ defaultReply });
    });
    afterEach(async () => {
      await customSham.reset();
    });
    afterAll(async () => {
      await customSham.close();
    });

    test("it should return the default default reply", async () => {
      const response = await fetch(`${sham.uri}/some/uri`);

      expect(response).toHaveProperty("status", 404);
      expect(response.headers.get("content-type")).toBe("text/plain");
      expect(await response.text()).toBe("Not Found");
    });

    test("it should return the supplied default reply", async () => {
      const response = await fetch(`${customSham.uri}/some/uri`);

      expect(response).toHaveProperty("status", defaultReply.status);
      expect(response.headers.get("content-type")).toBe("application/json");
      expect(await response.json()).toEqual(defaultReply.body);
    });
  });

  describe("Using matchers", () => {
    test("it should give each matcher an id", async () => {
      const matcher = await sham.addMatcher({
        when: ({ equals }) => equals("pathname", "/some/uri"),
        respond: { body: { yay: true } }
      });

      expect(matcher).toHaveProperty("id");
    });

    test("it should return the specified response when a request matching the matcher is made", async () => {
      let response = await fetch(`${sham.uri}/test`);

      expect(response).toHaveProperty("status", 404);
      expect(response.headers.get("content-type")).toBe("text/plain");
      expect(await response.text()).toBe("Not Found");

      const status = 200;
      const contentType = "application/json";
      const body = { this: { is: { a: "mock" } } };
      await sham.addMatcher({
        when: ({ equals }) => equals("pathname", "/test"),
        respond: { status, headers: { "Content-Type": contentType }, body }
      });

      response = await fetch(`${sham.uri}/test`);

      expect(response).toHaveProperty("status", status);
      expect(response.headers.get("content-type")).toBe(contentType);
      expect(await response.json()).toEqual(body);
    });

    describe("Using complex matchers", () => {
      beforeEach(async () => {
        await sham.addMatcher({
          when: (
            {
              and,
              or,
              not,
              equals,
              greaterThan,
              greaterThanOrEquals,
              lessThan,
              lessThanOrEquals,
              regex
            }
          ) =>
            or(
              and(equals("method", "PUT"), regex("pathname", /(\/sham){3,5}$/)),
              and(
                equals("method", "POST"),
                greaterThan("body.values.a", 5),
                greaterThanOrEquals("body.values.b", 2)
              ),
              and(
                equals("method", "GET"),
                lessThanOrEquals("query.test", 7),
                not(lessThan("query.test", 3))
              )
            ),
          respond: {
            body: { success: true }
          }
        });
      });

      test("example 1", async () => {
        expect(
          await fetch(`${sham.uri}/sham/sham`, { method: "PUT" })
        ).toHaveProperty("status", 404);
        expect(
          await fetch(`${sham.uri}/sham/sham/sham/sham`, { method: "PUT" })
        ).toHaveProperty("status", 200);
      });

      test("example 2", async () => {
        expect(
          await fetch(`${sham.uri}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              values: {
                a: 5,
                b: 2
              }
            })
          })
        ).toHaveProperty("status", 404);
        expect(
          await fetch(`${sham.uri}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              values: {
                a: 6,
                b: 1
              }
            })
          })
        ).toHaveProperty("status", 404);
        expect(
          await fetch(`${sham.uri}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              values: {
                a: 6,
                b: 5
              }
            })
          })
        ).toHaveProperty("status", 200);
      });

      test("example 3", async () => {
        expect(await fetch(`${sham.uri}?test=2`)).toHaveProperty("status", 404);
        expect(await fetch(`${sham.uri}?test=8`)).toHaveProperty("status", 404);
        expect(await fetch(`${sham.uri}?test=6`)).toHaveProperty("status", 200);
      });
    });

    describe("Matcher validation", () => {
      test("Must pass an object to addMatcher", async () => {
        await expect(sham.addMatcher()).rejects.toEqual(
          new Error(
            "Error creating matcher: The matcher definition must be an object"
          )
        );
      });

      test("Must contain a when property", async () => {
        await expect(
          sham.addMatcher({
            respond: {}
          })
        ).rejects.toEqual(
          new Error(
            "Error creating matcher: The matcher must contain a valid when property"
          )
        );
      });

      test("when property must be an object", async () => {
        await expect(
          sham.addMatcher({
            when: "",
            respond: {}
          })
        ).rejects.toEqual(
          new Error(
            "Error creating matcher: The matcher must contain a valid when property"
          )
        );
      });

      test("respond property must be an object", async () => {
        await expect(
          sham.addMatcher({
            when: { op: "==", prop: "pathname", value: "/test" },
            respond: ""
          })
        ).rejects.toEqual(
          new Error(
            "Error creating matcher: The matcher must contain a valid respond property"
          )
        );
      });

      //TODO: More validation of when and respond properties, should traverse and check format.
    });

    test("it should always try match the most recently added matcher first", async () => {
      await sham.addMatcher({
        when: ({ equals }) => equals("pathname", "/test"),
        respond: { body: "test 1" }
      });

      let response = await fetch(`${sham.uri}/test`);
      expect(await response.text()).toBe("test 1");

      await sham.addMatcher({
        when: ({ equals }) => equals("pathname", "/test"),
        respond: { body: "test 2" }
      });

      response = await fetch(`${sham.uri}/test`);
      expect(await response.text()).toBe("test 2");
    });

    test("it should allow you to list all of the mocks that have been created", async () => {
      const matcherA = await sham.addMatcher({
        when: ({ equals }) => equals("pathname", "/test"),
        respond: { body: "test 1" }
      });
      const matcherB = await sham.addMatcher({
        when: ({ equals }) => equals("pathname", "/test"),
        respond: { body: "test 2" }
      });

      const matchers = await sham.getMatchers();
      expect(matchers).toHaveLength(2);
      expect(matchers).toContainEqual(matcherA);
      expect(matchers).toContainEqual(matcherB);
    });

    test("it should allow you retrieve a mock by id", async () => {
      const created = await sham.addMatcher({
        when: ({ equals }) => equals("pathname", "/test"),
        respond: { body: "test 1" }
      });

      const matcher = await sham.getMatcher(created.id);
      expect(matcher).toEqual(created);
    });

    test("it should allow you to delete a mock", async () => {
      const matcher = await sham.addMatcher({
        when: ({ equals }) => equals("pathname", "/test"),
        respond: { body: "test 1" }
      });

      let response = await fetch(`${sham.uri}/test`);
      expect(await response.text()).toBe("test 1");

      await sham.deleteMatcher(matcher.id);

      response = await fetch(`${sham.uri}/test`);
      expect(await response.text()).toBe("Not Found");
    });

    test("it should allow to set how many times a matcher should match before it expires", async () => {
      const { id } = await sham.addMatcher({
        when: ({ equals }) => equals("pathname", "/test"),
        respond: { body: "test 1" },
        times: 2
      });

      let response = await fetch(`${sham.uri}/test`);
      expect(await response.text()).toBe("test 1");

      response = await fetch(`${sham.uri}/test`);
      expect(await response.text()).toBe("test 1");

      response = await fetch(`${sham.uri}/test`);
      expect(await response.text()).toBe("Not Found");

      const matcher = await sham.getMatcher(id);
      expect(matcher).toHaveProperty("times", 0);
    });

    test("it should reset the list of matchers and requests", async () => {
      await sham.addMatcher({
        when: ({ equals }) => equals("pathname", "/test"),
        respond: { body: "test 1" },
        times: 2
      });
      await fetch(`${sham.uri}/test`);

      expect(await sham.getMatchers()).toHaveLength(1);
      expect(await sham.getRequests()).toHaveLength(1);

      await sham.reset();

      expect(await sham.getMatchers()).toHaveLength(0);
      expect(await sham.getRequests()).toHaveLength(0);
    });
  });

  describe("Retrieving requests", () => {
    test("it should log each request", async () => {
      await sham.addMatcher({
        when: ({ equals }) => equals("pathname", "/test"),
        respond: { body: "test 1" }
      });
      await fetch(`${sham.uri}/test`);
      await fetch(`${sham.uri}/test`);

      expect(await sham.getRequests()).toHaveLength(2);

      await fetch(`${sham.uri}/test`);

      expect(await sham.getRequests()).toHaveLength(3);
    });

    test("it should log requests which don`t match", async () => {
      await fetch(`${sham.uri}/thing1`);
      await fetch(`${sham.uri}/thing2`);

      expect(await sham.getRequests()).toHaveLength(2);

      await fetch(`${sham.uri}/thing3`);

      expect(await sham.getRequests()).toHaveLength(3);
    });

    test("it should record which matcher was matched", async () => {
      const matcherA = await sham.addMatcher({
        when: ({ equals }) => equals("pathname", "/test1"),
        respond: { body: "test 1" }
      });
      const matcherB = await sham.addMatcher({
        when: ({ equals }) => equals("pathname", "/test2"),
        respond: { body: "test 2" }
      });
      const matcherC = await sham.addMatcher({
        when: ({ equals }) => equals("pathname", "/test3"),
        respond: { body: "test " }
      });

      await fetch(`${sham.uri}/test1`);
      await fetch(`${sham.uri}/test2`);
      await fetch(`${sham.uri}/test3`);
      await fetch(`${sham.uri}/test4`);

      const requests = await sham.getRequests();
      expect(requests).toHaveLength(4);
      expect(requests[0]).toHaveProperty("matcher", matcherA);
      expect(requests[1]).toHaveProperty("matcher", matcherB);
      expect(requests[2]).toHaveProperty("matcher", matcherC);
      expect(requests[3]).not.toHaveProperty("matcher");
    });
  });

  describe("Asserting that mocks have been called", () => {
    describe("sham.hasBeenCalled()", () => {
      test("it should return true if there are any requests in the requestStore", async () => {
        await fetch(`${sham.uri}/test`);

        expect(await sham.hasBeenCalled()).toBe(true);
      });

      test("it should throw an error if the sham has received no requests", async () => {
        await expect(sham.hasBeenCalled()).rejects.toBeDefined();
      });
    });

    describe("sham.not.hasBeenCalled()", () => {
      test("it should throw an error if there are any requests in the requestStore", async () => {
        await fetch(`${sham.uri}/test`);

        await expect(sham.not.hasBeenCalled()).rejects.toBeDefined();
      });

      test("it should return true if the sham has received no requests", async () => {
        expect(await sham.not.hasBeenCalled()).toBe(true);
      });
    });

    describe("sham.hasBeenCalledTimes(number)", () => {
      test("it should return true if the number of requests in the requestStore matches the number", async () => {
        await fetch(`${sham.uri}/test`);
        await fetch(`${sham.uri}/test2`);

        expect(await sham.hasBeenCalledTimes(2)).toBe(true);
      });

      test("it should throw an error if the number of requests in the requestStore does not match the number", async () => {
        await fetch(`${sham.uri}/test`);

        await expect(sham.hasBeenCalledTimes(2)).rejects.toBeDefined();
      });
    });

    describe("sham.not.hasBeenCalledTimes(number)", () => {
      test("it should throw an error if the number of requests in the requestStore matches the number", async () => {
        await fetch(`${sham.uri}/test`);
        await fetch(`${sham.uri}/test2`);

        await expect(sham.not.hasBeenCalledTimes(2)).rejects.toBeDefined();
      });

      test("it should return true if the number of requests in the requestStore does not match the number", async () => {
        await fetch(`${sham.uri}/test`);

        expect(await sham.not.hasBeenCalledTimes(2)).toBe(true);
      });
    });

    describe("sham.hasBeenCalledWith(condition)", () => {
      test("it should return true if the sham has received a request that matches the condition", async () => {
        await fetch(`${sham.uri}/test`);
        await fetch(`${sham.uri}/test2`);

        expect(
          await sham.hasBeenCalledWith(({ and, equals }) =>
            and(equals("method", "GET"), equals("pathname", "/test2")))
        ).toBe(true);
      });

      test("it should throw an error if the sham has not received a request that matches the condition", async () => {
        await fetch(`${sham.uri}/test`);

        await expect(
          sham.hasBeenCalledWith(({ and, equals }) =>
            and(equals("method", "GET"), equals("pathname", "/test2")))
        ).rejects.toBeDefined();
      });
    });

    describe("sham.not.hasBeenCalledWith(condition)", () => {
      test("it should throw an error if the sham has received a request that matches the condition", async () => {
        await fetch(`${sham.uri}/test`);
        await fetch(`${sham.uri}/test2`);

        await expect(
          sham.not.hasBeenCalledWith(({ and, equals }) =>
            and(equals("method", "GET"), equals("pathname", "/test2")))
        ).rejects.toBeDefined();
      });

      test("it should return true if the sham has not received a request that matches the condition", async () => {
        await fetch(`${sham.uri}/test`);

        expect(
          await sham.not.hasBeenCalledWith(({ and, equals }) =>
            and(equals("method", "GET"), equals("pathname", "/test2")))
        ).toBe(true);
      });
    });

    describe("sham.hasBeenLastCalledWith(condition)", () => {
      test("it should return true if the sham was last called with a request that matches the condition", async () => {
        await fetch(`${sham.uri}/test`);

        expect(
          await sham.hasBeenLastCalledWith(({ and, equals }) =>
            and(equals("method", "GET"), equals("pathname", "/test")))
        ).toBe(true);
      });

      test("it should throw an error if the sham was last called with a request that doesn't match the condition", async () => {
        await fetch(`${sham.uri}/test`);
        await fetch(`${sham.uri}/test2`);

        await expect(
          sham.hasBeenLastCalledWith(({ and, equals }) =>
            and(equals("method", "GET"), equals("pathname", "/test")))
        ).rejects.toBeDefined();
      });
    });

    describe("sham.not.hasBeenLastCalledWith(condition)", () => {
      test("it should throw an error if the sham was last called with a request that matches the condition", async () => {
        await fetch(`${sham.uri}/test`);

        await expect(
          sham.not.hasBeenLastCalledWith(({ and, equals }) =>
            and(equals("method", "GET"), equals("pathname", "/test")))
        ).rejects.toBeDefined();
      });

      test("it should return true if the sham was last called with a request that doesn't match the condition", async () => {
        await fetch(`${sham.uri}/test`);
        await fetch(`${sham.uri}/test2`);

        expect(
          await sham.not.hasBeenLastCalledWith(({ and, equals }) =>
            and(equals("method", "GET"), equals("pathname", "/test")))
        ).toBe(true);
      });
    });

    describe("matcher.hasBeenCalled()", () => {
      test("it should return true if there are any requests in the requestStore that matched the matcher", async () => {});

      test("it should throw an error if the sham has received no requests that matched the matcher", async () => {});
    });

    describe("matcher.not.hasBeenCalled()", () => {
      test("it should throw an error if there are any requests in the requestStore that matched the matcher", async () => {});

      test("it should return true if the sham has received no requests that matched the matcher", async () => {});
    });

    describe("matcher.hasBeenCalledTimes(x)", () => {
      test("it should return true if there are x requests in the requestStore that matched the matcher", async () => {});

      test("it should throw an error if there are x requests in the requestStore that matched the matcher", async () => {});
    });

    describe("matcher.not.hasBeenCalledTimes(x)", () => {
      test("it should throw an error if there are x requests in the requestStore that matched the matcher", async () => {});

      test("it should return true if there are x requests in the requestStore that matched the matcher", async () => {});
    });

    describe("matcher.hasBeenCalledWith(condition)", () => {
      test("it should return true if the sham has received a request that matches the condition and matched the matcher", async () => {});

      test("it should throw an error if the sham has not received a request that matches the condition and matched the matcher", async () => {});
    });

    describe("matcher.not.hasBeenCalledWith(condition)", () => {
      test("it should throw an error if the sham has received a request that matches the condition and matched the matcher", async () => {});

      test("it should return true if the sham has not received a request that matches the condition and matched the matcher", async () => {});
    });

    describe("matcher.hasBeenLastCalledWith(condition)", () => {
      test("it should return true if the last call that matched the matcher also matches the condition", async () => {});

      test("it should throw an error if the last call that matched the matcher also matches the condition", async () => {});
    });

    describe("matcher.not.hasBeenLastCalledWith(condition)", () => {
      test("it should throw an error if the last call that matched the matcher also matches the condition", async () => {});

      test("it should return true if the last call that matched the matcher also matches the condition", async () => {});
    });
  });

  describe("Shutting down a server", () => {
    test("it should be unable to access the sham after it is shut down", async () => {
      await sham.close();

      await expect(sham.getRequests()).rejects.toBeDefined();
      sham = await shamIt();

      expect(await sham.getRequests()).toEqual([]);
    });
  });
});
