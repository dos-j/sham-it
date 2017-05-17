const { spawn } = require("child_process");

const fetch = require("node-fetch");

describe("integration: api", () => {
  let uri;
  let isRunning;

  beforeAll(async () => {
    const message = await new Promise(resolve => {
      let firstMessage;
      const server = spawn("node", ["start-server.js"]);
      server.stdout.on("data", data => {
        if (!firstMessage) {
          firstMessage = true;
          resolve(data.toString());
        }
      });
      server.on("close", () => {
        isRunning = false;
      });
      server.on("exit", () => {
        isRunning = false;
      });
      isRunning = true;
    });

    uri = message.substr(message.lastIndexOf("http://localhost")).trim();
  });
  afterEach(async () => {
    await fetch(`${uri}/$reset`, { method: "POST" });
  });
  afterAll(async () => {
    await fetch(`${uri}/$shutdown`, { method: "POST" });
    expect(isRunning).toBe(false);
  });

  describe("Returning the default reply", () => {
    test("it should return the default default reply", async () => {
      const response = await fetch(`${uri}/some/uri`);

      expect(response).toHaveProperty("status", 404);
      expect(response.headers.get("content-type")).toBe("text/plain");
      expect(await response.text()).toBe("Not Found");
    });
  });

  describe("Using matchers", () => {
    test("it should give each matcher an id", async () => {
      const response = await fetch(`${uri}/$matchers`, {
        method: "POST",
        body: JSON.stringify({
          when: { op: "==", prop: "pathname", value: "/some/uri" },
          respond: { body: { yay: true } }
        })
      });
      const matcher = await response.json();

      expect(matcher).toHaveProperty("id");
    });

    test("it should return the specified response when a request matching the matcher is made", async () => {
      let response = await fetch(`${uri}/test`);

      expect(response).toHaveProperty("status", 404);
      expect(response.headers.get("content-type")).toBe("text/plain");
      expect(await response.text()).toBe("Not Found");

      const status = 200;
      const contentType = "application/json";
      const body = { this: { is: { a: "mock" } } };
      await fetch(`${uri}/$matchers`, {
        method: "POST",
        body: JSON.stringify({
          when: { op: "==", prop: "pathname", value: "/test" },
          respond: { status, headers: { "Content-Type": contentType }, body }
        })
      });

      response = await fetch(`${uri}/test`);

      expect(response).toHaveProperty("status", status);
      expect(response.headers.get("content-type")).toBe(contentType);
      expect(await response.json()).toEqual(body);
    });

    describe("Using complex matchers", () => {
      beforeEach(async () => {
        await fetch(`${uri}/$matchers`, {
          method: "POST",
          body: JSON.stringify({
            when: {
              op: "OR",
              values: [
                {
                  op: "AND",
                  values: [
                    { op: "==", prop: "method", value: "PUT" },
                    {
                      op: "REGEX",
                      prop: "pathname",
                      value: [/(\/sham){3,5}$/.source, ""]
                    }
                  ]
                },
                {
                  op: "AND",
                  values: [
                    { op: "==", prop: "method", value: "POST" },
                    { op: ">", prop: "body.values.a", value: 5 },
                    { op: ">=", prop: "body.values.b", value: 2 }
                  ]
                },
                {
                  op: "AND",
                  values: [
                    { op: "==", prop: "method", value: "GET" },
                    { op: "<=", prop: "query.test", value: 7 },
                    {
                      op: "!",
                      value: { op: "<", prop: "query.test", value: 3 }
                    }
                  ]
                }
              ]
            },
            respond: {
              body: { success: true }
            }
          })
        });
      });

      test("example 1", async () => {
        expect(
          await fetch(`${uri}/sham/sham`, { method: "PUT" })
        ).toHaveProperty("status", 404);
        expect(
          await fetch(`${uri}/sham/sham/sham/sham`, { method: "PUT" })
        ).toHaveProperty("status", 200);
      });

      test("example 2", async () => {
        expect(
          await fetch(`${uri}`, {
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
          await fetch(`${uri}`, {
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
          await fetch(`${uri}`, {
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
        expect(await fetch(`${uri}?test=2`)).toHaveProperty("status", 404);
        expect(await fetch(`${uri}?test=8`)).toHaveProperty("status", 404);
        expect(await fetch(`${uri}?test=6`)).toHaveProperty("status", 200);
      });
    });

    describe("Matcher validation", () => {
      test("Must pass an object to addMatcher", async () => {
        expect(
          await fetch(`${uri}/$matchers`, {
            method: "POST"
          }).then(res => res.text())
        ).toEqual("The matcher definition must be an object");
      });

      test("Must contain a when property", async () => {
        expect(
          await fetch(`${uri}/$matchers`, {
            method: "POST",
            body: JSON.stringify({
              respond: {}
            })
          }).then(res => res.text())
        ).toEqual("The matcher must contain a valid when property");
      });

      test("when property must be an object", async () => {
        expect(
          await fetch(`${uri}/$matchers`, {
            method: "POST",
            body: JSON.stringify({
              when: "",
              respond: {}
            })
          }).then(res => res.text())
        ).toEqual("The matcher must contain a valid when property");
      });

      test("respond property must be an object", async () => {
        expect(
          await fetch(`${uri}/$matchers`, {
            method: "POST",
            body: JSON.stringify({
              when: { op: "==", prop: "pathname", value: "/test" },
              respond: ""
            })
          }).then(res => res.text())
        ).toEqual("The matcher must contain a valid respond property");
      });

      //TODO: More validation of when and respond properties, should traverse and check format.
    });

    test("it should always try match the most recently added matcher first", async () => {
      await fetch(`${uri}/$matchers`, {
        method: "POST",
        body: JSON.stringify({
          when: { op: "==", prop: "pathname", value: "/test" },
          respond: { body: "test 1" }
        })
      });

      let response = await fetch(`${uri}/test`);
      expect(await response.text()).toBe("test 1");

      await fetch(`${uri}/$matchers`, {
        method: "POST",
        body: JSON.stringify({
          when: { op: "==", prop: "pathname", value: "/test" },
          respond: { body: "test 2" }
        })
      });

      response = await fetch(`${uri}/test`);
      expect(await response.text()).toBe("test 2");
    });

    test("it should allow you to list all of the mocks that have been created", async () => {
      const matcherA = await (await fetch(`${uri}/$matchers`, {
        method: "POST",
        body: JSON.stringify({
          when: { op: "==", prop: "pathname", value: "/test" },
          respond: { body: "test 1" }
        })
      })).json();
      const matcherB = await (await fetch(`${uri}/$matchers`, {
        method: "POST",
        body: JSON.stringify({
          when: { op: "==", prop: "pathname", value: "/test" },
          respond: { body: "test 2" }
        })
      })).json();

      const matchers = await (await fetch(`${uri}/$matchers`)).json();
      expect(matchers).toHaveLength(2);
      expect(matchers).toContainEqual(matcherA);
      expect(matchers).toContainEqual(matcherB);
    });

    test("it should allow you retrieve a mock by id", async () => {
      const created = await (await fetch(`${uri}/$matchers`, {
        method: "POST",
        body: JSON.stringify({
          when: { op: "==", prop: "pathname", value: "/test" },
          respond: { body: "test 1" }
        })
      })).json();

      const matcher = await (await fetch(
        `${uri}/$matchers/${created.id}`
      )).json();
      expect(matcher).toEqual(created);
    });

    test("it should allow you to delete a mock", async () => {
      const matcher = await (await fetch(`${uri}/$matchers`, {
        method: "POST",
        body: JSON.stringify({
          when: { op: "==", prop: "pathname", value: "/test" },
          respond: { body: "test 1" }
        })
      })).json();

      let response = await fetch(`${uri}/test`);
      expect(await response.text()).toBe("test 1");

      await fetch(`${uri}/$matchers/${matcher.id}`, { method: "DELETE" });

      response = await fetch(`${uri}/test`);
      expect(await response.text()).toBe("Not Found");
    });

    test("it should allow to set how many times a matcher should match before it expires", async () => {
      const { id } = await (await fetch(`${uri}/$matchers`, {
        method: "POST",
        body: JSON.stringify({
          when: { op: "==", prop: "pathname", value: "/test" },
          respond: { body: "test 1" },
          times: 2
        })
      })).json();

      let response = await fetch(`${uri}/test`);
      expect(await response.text()).toBe("test 1");

      response = await fetch(`${uri}/test`);
      expect(await response.text()).toBe("test 1");

      response = await fetch(`${uri}/test`);
      expect(await response.text()).toBe("Not Found");

      const matcher = await (await fetch(`${uri}/$matchers/${id}`)).json();
      expect(matcher).toHaveProperty("times", 0);
    });

    test("it should reset the list of matchers and requests", async () => {
      await fetch(`${uri}/$matchers`, {
        method: "POST",
        body: JSON.stringify({
          when: { op: "==", prop: "pathname", value: "/test" },
          respond: { body: "test 1" },
          times: 2
        })
      });
      await fetch(`${uri}/test`);

      expect(await (await fetch(`${uri}/$matchers`)).json()).toHaveLength(1);
      expect(await (await fetch(`${uri}/$requests`)).json()).toHaveLength(1);

      await fetch(`${uri}/$reset`, { method: "POST" });

      expect(await (await fetch(`${uri}/$matchers`)).json()).toHaveLength(0);
      expect(await (await fetch(`${uri}/$requests`)).json()).toHaveLength(0);
    });
  });

  describe("Retrieving requests", () => {
    test("it should log each request", async () => {
      await fetch(`${uri}/$matchers`, {
        method: "POST",
        body: JSON.stringify({
          when: { op: "==", prop: "pathname", value: "/test" },
          respond: { body: "test 1" }
        })
      });
      await fetch(`${uri}/test`);
      await fetch(`${uri}/test`);

      expect(await (await fetch(`${uri}/$requests`)).json()).toHaveLength(2);

      await fetch(`${uri}/test`);

      expect(await (await fetch(`${uri}/$requests`)).json()).toHaveLength(3);
    });

    test("it should log requests which don`t match", async () => {
      await fetch(`${uri}/thing1`);
      await fetch(`${uri}/thing2`);

      expect(await (await fetch(`${uri}/$requests`)).json()).toHaveLength(2);

      await fetch(`${uri}/thing3`);

      expect(await (await fetch(`${uri}/$requests`)).json()).toHaveLength(3);
    });

    test("it should record which matcher was matched", async () => {
      const matcherA = await (await fetch(`${uri}/$matchers`, {
        method: "POST",
        body: JSON.stringify({
          when: { op: "==", prop: "pathname", value: "/test1" },
          respond: { body: "test 1" }
        })
      })).json();
      const matcherB = await (await fetch(`${uri}/$matchers`, {
        method: "POST",
        body: JSON.stringify({
          when: { op: "==", prop: "pathname", value: "/test2" },
          respond: { body: "test 2" }
        })
      })).json();
      const matcherC = await (await fetch(`${uri}/$matchers`, {
        method: "POST",
        body: JSON.stringify({
          when: { op: "==", prop: "pathname", value: "/test3" },
          respond: { body: "test " }
        })
      })).json();

      await fetch(`${uri}/test1`);
      await fetch(`${uri}/test2`);
      await fetch(`${uri}/test3`);
      await fetch(`${uri}/test4`);

      const requests = await (await fetch(`${uri}/$requests`)).json();
      expect(requests).toHaveLength(4);
      expect(requests[0]).toHaveProperty("matcher", matcherA);
      expect(requests[1]).toHaveProperty("matcher", matcherB);
      expect(requests[2]).toHaveProperty("matcher", matcherC);
      expect(requests[3]).not.toHaveProperty("matcher");
    });
  });

  describe("Asserting that mocks have been called", () => {
    describe("$hasbeencalled", () => {
      test("it should return true if there are any requests in the requestStore", async () => {
        await fetch(`${uri}/test`);

        expect(
          await fetch(`${uri}/$hasbeencalled`, { method: "POST" })
        ).toHaveProperty("status", 204);
      });

      test("it should throw an error if the sham has received no requests", async () => {
        expect(
          await fetch(`${uri}/$hasbeencalled`, { method: "POST" })
        ).toHaveProperty("status", 417);
      });
    });

    describe("$not/hasbeencalled", () => {
      test("it should return true if there are no requests in the requestStore", async () => {
        const res = await fetch(`${uri}/$not/hasbeencalled`, {
          method: "POST"
        });

        expect(res).toHaveProperty("status", 204);
      });

      test("it should throw an error if the sham has received a request", async () => {
        await fetch(`${uri}/test`);

        expect(
          await fetch(`${uri}/$not/hasbeencalled`, { method: "POST" })
        ).toHaveProperty("status", 417);
      });
    });

    describe("$hasbeencalledtimes", () => {
      test("it should return true if the number of requests in the requestStore matches the number", async () => {
        await fetch(`${uri}/test`);
        await fetch(`${uri}/test2`);

        expect(
          await fetch(`${uri}/$hasbeencalledtimes`, {
            method: "POST",
            body: "2"
          })
        ).toHaveProperty("status", 204);
      });

      test("it should throw an error if the number of requests in the requestStore does not match the number", async () => {
        await fetch(`${uri}/test`);

        expect(
          await fetch(`${uri}/$hasbeencalledtimes`, {
            method: "POST",
            body: "2"
          })
        ).toHaveProperty("status", 417);
      });
    });

    describe("$not/hasbeencalledtimes", () => {
      test("it should return true if the number of requests in the requestStore matches the number", async () => {
        await fetch(`${uri}/test`);
        await fetch(`${uri}/test2`);

        expect(
          await fetch(`${uri}/$not/hasbeencalledtimes`, {
            method: "POST",
            body: "1"
          })
        ).toHaveProperty("status", 204);
      });

      test("it should throw an error if the number of requests in the requestStore does not match the number", async () => {
        await fetch(`${uri}/test`);

        expect(
          await fetch(`${uri}/$not/hasbeencalledtimes`, {
            method: "POST",
            body: "1"
          })
        ).toHaveProperty("status", 417);
      });
    });

    describe("$hasbeencalledwith", () => {
      test("it should return true if the number of requests in the requestStore matches the number", async () => {
        await fetch(`${uri}/test`);
        await fetch(`${uri}/test2`);

        expect(
          await fetch(`${uri}/$hasbeencalledwith`, {
            method: "POST",
            body: JSON.stringify({
              op: "AND",
              values: [
                { op: "==", prop: "method", value: "GET" },
                { op: "==", prop: "pathname", value: "/test2" }
              ]
            })
          })
        ).toHaveProperty("status", 204);
      });

      test("it should throw an error if the number of requests in the requestStore does not match the number", async () => {
        await fetch(`${uri}/test`);

        expect(
          await fetch(`${uri}/$hasbeencalledwith`, {
            method: "POST",
            body: JSON.stringify({
              op: "AND",
              values: [
                { op: "==", prop: "method", value: "GET" },
                { op: "==", prop: "pathname", value: "/test2" }
              ]
            })
          })
        ).toHaveProperty("status", 417);
      });
    });

    describe("$not/hasbeencalledwith", () => {
      test("it should return true if the number of requests in the requestStore matches the number", async () => {
        await fetch(`${uri}/test`);

        expect(
          await fetch(`${uri}/$not/hasbeencalledwith`, {
            method: "POST",
            body: JSON.stringify({
              op: "AND",
              values: [
                { op: "==", prop: "method", value: "GET" },
                { op: "==", prop: "pathname", value: "/test2" }
              ]
            })
          })
        ).toHaveProperty("status", 204);
      });

      test("it should throw an error if the number of requests in the requestStore does not match the number", async () => {
        await fetch(`${uri}/test`);
        await fetch(`${uri}/test2`);

        expect(
          await fetch(`${uri}/$not/hasbeencalledwith`, {
            method: "POST",
            body: JSON.stringify({
              op: "AND",
              values: [
                { op: "==", prop: "method", value: "GET" },
                { op: "==", prop: "pathname", value: "/test2" }
              ]
            })
          })
        ).toHaveProperty("status", 417);
      });
    });

    describe("$hasbeenlastcalledwith", () => {
      test("it should return true if the number of requests in the requestStore matches the number", async () => {
        await fetch(`${uri}/test`);

        expect(
          await fetch(`${uri}/$hasbeenlastcalledwith`, {
            method: "POST",
            body: JSON.stringify({
              op: "AND",
              values: [
                { op: "==", prop: "method", value: "GET" },
                { op: "==", prop: "pathname", value: "/test" }
              ]
            })
          })
        ).toHaveProperty("status", 204);
      });

      test("it should throw an error if the number of requests in the requestStore does not match the number", async () => {
        await fetch(`${uri}/test`);
        await fetch(`${uri}/test2`);

        expect(
          await fetch(`${uri}/$hasbeenlastcalledwith`, {
            method: "POST",
            body: JSON.stringify({
              op: "AND",
              values: [
                { op: "==", prop: "method", value: "GET" },
                { op: "==", prop: "pathname", value: "/test" }
              ]
            })
          })
        ).toHaveProperty("status", 417);
      });
    });

    describe("$not/hasbeenlastcalledwith", () => {
      test("it should return true if the number of requests in the requestStore matches the number", async () => {
        await fetch(`${uri}/test`);
        await fetch(`${uri}/test2`);

        expect(
          await fetch(`${uri}/$not/hasbeenlastcalledwith`, {
            method: "POST",
            body: JSON.stringify({
              op: "AND",
              values: [
                { op: "==", prop: "method", value: "GET" },
                { op: "==", prop: "pathname", value: "/test" }
              ]
            })
          })
        ).toHaveProperty("status", 204);
      });

      test("it should throw an error if the number of requests in the requestStore does not match the number", async () => {
        await fetch(`${uri}/test`);

        expect(
          await fetch(`${uri}/$not/hasbeenlastcalledwith`, {
            method: "POST",
            body: JSON.stringify({
              op: "AND",
              values: [
                { op: "==", prop: "method", value: "GET" },
                { op: "==", prop: "pathname", value: "/test" }
              ]
            })
          })
        ).toHaveProperty("status", 417);
      });
    });
  });
});
