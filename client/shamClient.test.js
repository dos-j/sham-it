const shamClient = require("./shamClient");

jest.mock("node-fetch", () => {
  const fetch = jest.fn(() => Promise.resolve(fetch.__successResponse));
  fetch.__successResponse = {
    status: 200,
    json: jest.fn(() => Promise.resolve(fetch.__successJson)),
    text: jest.fn(() => Promise.resolve(fetch.__successText))
  };
  fetch.__successJson = { some: "data" };
  fetch.__successText = '{ "some": "data" }';

  return fetch;
});
const fetch = require("node-fetch");

describe("unit: shamClient", () => {
  let port;
  let client;

  beforeEach(() => {
    port = 9001;

    fetch.mockClear();
    fetch.__successResponse.json.mockClear();
    fetch.__successResponse.text.mockClear();

    client = shamClient({ port });
  });

  describe("Constructing the URI", () => {
    test("It should set the uri to be localhost plus the port", () => {
      expect(client.uri).toBe(`http://localhost:${port}`);
    });

    test("it should use https if the https flag is set", () => {
      const httpsClient = shamClient({ port, https: true });

      expect(httpsClient.uri).toBe(`https://localhost:${port}`);
    });
  });

  describe("Creating a matcher", () => {
    test("it should POST /$matchers", async () => {
      await client.addMatcher({
        when: {
          op: "AND",
          values: [
            { op: "==", prop: "request.uri.pathname", value: "/test" },
            { op: "==", prop: "request.method", value: "GET" }
          ]
        },
        respond: {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: { my: "data" }
        }
      });

      expect(fetch).toHaveBeenCalledWith(`${client.uri}/$matchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          when: {
            op: "AND",
            values: [
              { op: "==", prop: "request.uri.pathname", value: "/test" },
              { op: "==", prop: "request.method", value: "GET" }
            ]
          },
          respond: {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { my: "data" }
          }
        })
      });
    });

    test("it should accept a function for when which provides helpers to build the expression", async () => {
      await client.addMatcher({
        when: ({ and, equals }) =>
          and(
            equals("request.uri.pathname", "/test"),
            equals("request.method", "GET")
          ),
        respond: {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: { my: "data" }
        }
      });

      expect(fetch).toHaveBeenCalledWith(`${client.uri}/$matchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          when: {
            op: "AND",
            values: [
              { op: "==", prop: "request.uri.pathname", value: "/test" },
              { op: "==", prop: "request.method", value: "GET" }
            ]
          },
          respond: {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { my: "data" }
          }
        })
      });
    });

    test("it should throw an error if the response is above 2XX", async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          status: 500,
          text() {
            return Promise.resolve("Internal Server Error");
          }
        }));

      const expected = new Error(
        "Error creating matcher: Internal Server Error"
      );
      expected.statusCode = 500;

      const promise = client.addMatcher({
        when: {},
        respond: { body: "test" }
      });
      await expect(promise).rejects.toEqual(expected);
      await expect(promise).rejects.toHaveProperty(
        "statusCode",
        expected.statusCode
      );
    });

    test("it should throw an error if the response is below 2XX", async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          status: 100,
          text() {
            return Promise.resolve("Continue");
          }
        }));

      const expected = new Error("Error creating matcher: Continue");
      expected.statusCode = 100;

      const promise = client.addMatcher({
        when: {},
        respond: { body: "test" }
      });

      await expect(promise).rejects.toEqual(expected);
      await expect(promise).rejects.toHaveProperty(
        "statusCode",
        expected.statusCode
      );
    });

    test("it should return the response from the sham", async () => {
      expect(
        await client.addMatcher({ when: {}, responde: { body: "test" } })
      ).toBe(fetch.__successJson);
    });

    describe("Helpers", () => {
      test("and", () => {
        expect(client.whenBuilder(({ and }) => and("a", "b", "c"))).toEqual({
          op: "AND",
          values: ["a", "b", "c"]
        });
      });

      test("equals", () => {
        expect(client.whenBuilder(({ equals }) => equals("a", "b"))).toEqual({
          op: "==",
          prop: "a",
          value: "b"
        });
      });

      test("or", () => {
        expect(client.whenBuilder(({ or }) => or("a", "b", "c"))).toEqual({
          op: "OR",
          values: ["a", "b", "c"]
        });
      });

      test("not", () => {
        expect(client.whenBuilder(({ not }) => not("a"))).toEqual({
          op: "!",
          value: "a"
        });
      });

      test("greaterThan", () => {
        expect(
          client.whenBuilder(({ greaterThan }) => greaterThan("a", "b"))
        ).toEqual({
          op: ">",
          prop: "a",
          value: "b"
        });
      });

      test("greaterThanOrEquals", () => {
        expect(
          client.whenBuilder(({ greaterThanOrEquals }) =>
            greaterThanOrEquals("a", "b"))
        ).toEqual({
          op: ">=",
          prop: "a",
          value: "b"
        });
      });

      test("lessThan", () => {
        expect(
          client.whenBuilder(({ lessThan }) => lessThan("a", "b"))
        ).toEqual({
          op: "<",
          prop: "a",
          value: "b"
        });
      });

      test("lessThanOrEquals", () => {
        expect(
          client.whenBuilder(({ lessThanOrEquals }) =>
            lessThanOrEquals("a", "b"))
        ).toEqual({
          op: "<=",
          prop: "a",
          value: "b"
        });
      });

      test("REGEX", () => {
        expect(client.whenBuilder(({ regex }) => regex("a", /.*/i))).toEqual({
          op: "REGEX",
          prop: "a",
          value: [".*", "i"]
        });
      });
    });
  });

  describe("Retrieving a single matcher", () => {
    test("it should GET /$matchers/{id}", async () => {
      await client.getMatcher(1234);

      expect(fetch).toHaveBeenCalledWith(`${client.uri}/$matchers/1234`);
    });

    test("it should return the response", async () => {
      expect(await client.getMatcher(1234)).toBe(fetch.__successJson);
    });

    test("it should throw an error if the response is above 2XX", async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          status: 100,
          text() {
            return Promise.resolve("Continue");
          }
        }));

      const expected = new Error("Error retrieving matcher: Continue");
      expected.statusCode = 100;

      const promise = client.getMatcher(1234);
      await expect(promise).rejects.toEqual(expected);
      await expect(promise).rejects.toHaveProperty(
        "statusCode",
        expected.statusCode
      );
    });

    test("it should throw an error if the response is above 2XX", async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          status: 500,
          text() {
            return Promise.resolve("Internal Server Error");
          }
        }));

      const expected = new Error(
        "Error retrieving matcher: Internal Server Error"
      );
      expected.statusCode = 500;

      const promise = client.getMatcher(1234);
      await expect(promise).rejects.toEqual(expected);
      await expect(promise).rejects.toHaveProperty(
        "statusCode",
        expected.statusCode
      );
    });
  });

  describe("Deleting a matcher", () => {
    test("it should DELETE /$matchers/{id}", async () => {
      await client.deleteMatcher(1234);

      expect(fetch).toHaveBeenCalledWith(`${client.uri}/$matchers/1234`, {
        method: "DELETE"
      });
    });

    test("it should not return anything if successful", async () => {
      expect(await client.deleteMatcher(1234)).toBeUndefined();
    });

    test("it should throw an error if the response is above 2XX", async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          status: 100,
          text() {
            return Promise.resolve("Continue");
          }
        }));

      const expected = new Error("Error deleting matcher: Continue");
      expected.statusCode = 100;

      const promise = client.deleteMatcher(1234);
      await expect(promise).rejects.toEqual(expected);
      await expect(promise).rejects.toHaveProperty(
        "statusCode",
        expected.statusCode
      );
    });

    test("it should throw an error if the response is above 2XX", async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          status: 500,
          text() {
            return Promise.resolve("Internal Server Error");
          }
        }));

      const expected = new Error(
        "Error deleting matcher: Internal Server Error"
      );
      expected.statusCode = 500;

      const promise = client.deleteMatcher(1234);
      await expect(promise).rejects.toEqual(expected);
      await expect(promise).rejects.toHaveProperty(
        "statusCode",
        expected.statusCode
      );
    });
  });

  describe("Retrieving a list of matchers", () => {
    test("it should GET /$matchers", async () => {
      await client.getMatchers();

      expect(fetch).toHaveBeenCalledWith(`${client.uri}/$matchers`);
    });

    test("it should return the response", async () => {
      expect(await client.getMatchers()).toBe(fetch.__successJson);
    });

    test("it should throw an error if the response is below 2XX", async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          status: 100,
          text() {
            return Promise.resolve("Continue");
          }
        }));

      const expected = new Error("Error retrieving matchers: Continue");
      expected.statusCode = 100;

      const promise = client.getMatchers();
      await expect(promise).rejects.toEqual(expected);
      await expect(promise).rejects.toHaveProperty(
        "statusCode",
        expected.statusCode
      );
    });

    test("it should throw an error if the response is above 2XX", async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          status: 500,
          text() {
            return Promise.resolve("Internal Server Error");
          }
        }));

      const expected = new Error(
        "Error retrieving matchers: Internal Server Error"
      );
      expected.statusCode = 500;

      const promise = client.getMatchers();
      await expect(promise).rejects.toEqual(expected);
      await expect(promise).rejects.toHaveProperty(
        "statusCode",
        expected.statusCode
      );
    });
  });

  describe("Retrieving a list of requests", () => {
    test("it should GET /$requests", async () => {
      await client.getRequests();

      expect(fetch).toHaveBeenCalledWith(`${client.uri}/$requests`);
    });

    test("it should return the response", async () => {
      expect(await client.getRequests()).toBe(fetch.__successJson);
    });

    test("it should throw an error if the response is above 2XX", async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          status: 100,
          text() {
            return Promise.resolve("Continue");
          }
        }));

      const expected = new Error("Error retrieving requests: Continue");
      expected.statusCode = 100;

      const promise = client.getRequests();
      await expect(promise).rejects.toEqual(expected);
      await expect(promise).rejects.toHaveProperty(
        "statusCode",
        expected.statusCode
      );
    });

    test("it should throw an error if the response is above 2XX", async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          status: 500,
          text() {
            return Promise.resolve("Internal Server Error");
          }
        }));

      const expected = new Error(
        "Error retrieving requests: Internal Server Error"
      );
      expected.statusCode = 500;

      const promise = client.getRequests();
      await expect(promise).rejects.toEqual(expected);
      await expect(promise).rejects.toHaveProperty(
        "statusCode",
        expected.statusCode
      );
    });
  });

  describe("Resetting the Sham", () => {
    test("it should POST /$reset", async () => {
      await client.reset();

      expect(fetch).toHaveBeenCalledWith(`${client.uri}/$reset`, {
        method: "POST"
      });
    });

    test("it should not return anything", async () => {
      expect(await client.reset()).toBeUndefined();
    });

    test("it should throw an error if the response is above 2XX", async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          status: 100,
          text() {
            return Promise.resolve("Continue");
          }
        }));

      const expected = new Error(
        "Error resetting matchers and requests: Continue"
      );
      expected.statusCode = 100;

      const promise = client.reset();
      await expect(promise).rejects.toEqual(expected);
      await expect(promise).rejects.toHaveProperty(
        "statusCode",
        expected.statusCode
      );
    });

    test("it should throw an error if the response is above 2XX", async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          status: 500,
          text() {
            return Promise.resolve("Internal Server Error");
          }
        }));

      const expected = new Error(
        "Error resetting matchers and requests: Internal Server Error"
      );
      expected.statusCode = 500;

      const promise = client.reset();
      await expect(promise).rejects.toEqual(expected);
      await expect(promise).rejects.toHaveProperty(
        "statusCode",
        expected.statusCode
      );
    });
  });

  describe("Shutting down the server", () => {
    test("it should POST /$shutdown", async () => {
      await client.close();

      expect(fetch).toHaveBeenCalledWith(`${client.uri}/$shutdown`, {
        method: "POST"
      });
    });

    test("it should not return anything", async () => {
      expect(await client.close()).toBeUndefined();
    });

    test("it should throw an error if the response is above 2XX", async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          status: 100,
          text() {
            return Promise.resolve("Continue");
          }
        }));

      const expected = new Error("Error shutting down the sham: Continue");
      expected.statusCode = 100;

      const promise = client.close();
      await expect(promise).rejects.toEqual(expected);
      await expect(promise).rejects.toHaveProperty(
        "statusCode",
        expected.statusCode
      );
    });

    test("it should throw an error if the response is above 2XX", async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          status: 500,
          text() {
            return Promise.resolve("Internal Server Error");
          }
        }));

      const expected = new Error(
        "Error shutting down the sham: Internal Server Error"
      );
      expected.statusCode = 500;

      const promise = client.close();
      await expect(promise).rejects.toEqual(expected);
      await expect(promise).rejects.toHaveProperty(
        "statusCode",
        expected.statusCode
      );
    });
  });

  describe("Expectations", () => {
    describe(".hasBeenCalled()", () => {
      test("it should call '/$hasbeencalled'", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.hasBeenCalled();

        expect(fetch).toHaveBeenCalledWith(`${client.uri}/$hasbeencalled`, {
          method: "POST"
        });
        expect(await client.hasBeenCalled()).toBe(true);
      });

      test("it should return true if the sham returns a successful response", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.hasBeenCalled();

        expect(await client.hasBeenCalled()).toBe(true);
      });

      test("it should throw an error if the sham returns an unsuccessful response", async () => {
        const errorMessage = "error";
        fetch.mockImplementationOnce(() =>
          Promise.resolve({
            status: 417,
            text: () => Promise.resolve(errorMessage)
          }));

        await expect(client.hasBeenCalled()).rejects.toEqual(
          new Error(errorMessage)
        );
      });
    });

    describe(".not.hasBeenCalled()", () => {
      test("it should call '/$not/hasbeencalled'", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.not.hasBeenCalled();

        expect(fetch).toHaveBeenCalledWith(`${client.uri}/$not/hasbeencalled`, {
          method: "POST"
        });
        expect(await client.hasBeenCalled()).toBe(true);
      });

      test("it should return true if the sham returns a successful response", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.hasBeenCalled();

        expect(await client.hasBeenCalled()).toBe(true);
      });

      test("it should throw an error if the sham returns an unsuccessful response", async () => {
        const errorMessage = "error";
        fetch.mockImplementationOnce(() =>
          Promise.resolve({
            status: 417,
            text: () => Promise.resolve(errorMessage)
          }));

        await expect(client.hasBeenCalled()).rejects.toEqual(
          new Error(errorMessage)
        );
      });
    });

    describe(".hasBeenCalledTimes(number)", () => {
      test("it should call '/$hasbeencalledtimes'", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.hasBeenCalledTimes(2);

        expect(
          fetch
        ).toHaveBeenCalledWith(`${client.uri}/$hasbeencalledtimes`, {
          method: "POST",
          body: "2"
        });
      });

      test("it should return true if the sham returns a successful response", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        expect(await client.hasBeenCalledTimes(2)).toBe(true);
      });

      test("it should throw an error if the sham returns an unsuccessful response", async () => {
        const errorMessage = "error";
        fetch.mockImplementationOnce(() =>
          Promise.resolve({
            status: 417,
            text: () => Promise.resolve(errorMessage)
          }));

        await expect(client.hasBeenCalledTimes(2)).rejects.toEqual(
          new Error(errorMessage)
        );
      });
    });

    describe(".not.hasBeenCalledTimes(number)", () => {
      test("it should call '/$not/hasbeencalledtimes'", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.not.hasBeenCalledTimes(2);

        expect(
          fetch
        ).toHaveBeenCalledWith(`${client.uri}/$not/hasbeencalledtimes`, {
          method: "POST",
          body: "2"
        });
      });

      test("it should return true if the sham returns a successful response", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        expect(await client.not.hasBeenCalledTimes(2)).toBe(true);
      });

      test("it should throw an error if the sham returns an unsuccessful response", async () => {
        const errorMessage = "error";
        fetch.mockImplementationOnce(() =>
          Promise.resolve({
            status: 417,
            text: () => Promise.resolve(errorMessage)
          }));

        await expect(client.not.hasBeenCalledTimes(2)).rejects.toEqual(
          new Error(errorMessage)
        );
      });
    });

    describe(".hasBeenCalledWith(queryBuilder)", () => {
      let queryBuilder;
      let query;

      beforeEach(() => {
        query = { op: "==", prop: "pathname", value: "/test" };
        queryBuilder = jest.fn(() => query);
      });

      test("it should call '/$hasbeencalledwith'", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.hasBeenCalledWith(queryBuilder);

        expect(fetch).toHaveBeenCalledWith(`${client.uri}/$hasbeencalledwith`, {
          method: "POST",
          body: JSON.stringify(query)
        });
      });

      test("it should build the query", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.hasBeenCalledWith(queryBuilder);

        expect(queryBuilder).toHaveBeenCalledWith({
          and: expect.any(Function),
          or: expect.any(Function),
          not: expect.any(Function),
          equals: expect.any(Function),
          greaterThan: expect.any(Function),
          greaterThanOrEquals: expect.any(Function),
          lessThan: expect.any(Function),
          lessThanOrEquals: expect.any(Function),
          regex: expect.any(Function)
        });
      });

      test("it should use a built query if it is given", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.hasBeenCalledWith(query);

        expect(fetch).toHaveBeenCalledWith(`${client.uri}/$hasbeencalledwith`, {
          method: "POST",
          body: JSON.stringify(query)
        });
      });

      test("it should return true if the sham returns a successful response", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        expect(await client.hasBeenCalledWith(queryBuilder)).toBe(true);
      });

      test("it should throw an error if the sham returns an unsuccessful response", async () => {
        const errorMessage = "error";
        fetch.mockImplementationOnce(() =>
          Promise.resolve({
            status: 417,
            text: () => Promise.resolve(errorMessage)
          }));

        await expect(client.hasBeenCalledWith(queryBuilder)).rejects.toEqual(
          new Error(errorMessage)
        );
      });
    });

    describe(".not.hasBeenCalledWith(queryBuilder)", () => {
      let queryBuilder;
      let query;

      beforeEach(() => {
        query = { op: "==", prop: "pathname", value: "/test" };
        queryBuilder = jest.fn(() => query);
      });

      test("it should call '/$not/hasbeencalledwith'", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.not.hasBeenCalledWith(queryBuilder);

        expect(
          fetch
        ).toHaveBeenCalledWith(`${client.uri}/$not/hasbeencalledwith`, {
          method: "POST",
          body: JSON.stringify(query)
        });
      });

      test("it should build the query", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.not.hasBeenCalledWith(queryBuilder);

        expect(queryBuilder).toHaveBeenCalledWith({
          and: expect.any(Function),
          or: expect.any(Function),
          not: expect.any(Function),
          equals: expect.any(Function),
          greaterThan: expect.any(Function),
          greaterThanOrEquals: expect.any(Function),
          lessThan: expect.any(Function),
          lessThanOrEquals: expect.any(Function),
          regex: expect.any(Function)
        });
      });

      test("it should use a built query if it is given", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.not.hasBeenCalledWith(query);

        expect(
          fetch
        ).toHaveBeenCalledWith(`${client.uri}/$not/hasbeencalledwith`, {
          method: "POST",
          body: JSON.stringify(query)
        });
      });

      test("it should return true if the sham returns a successful response", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        expect(await client.not.hasBeenCalledWith(queryBuilder)).toBe(true);
      });

      test("it should throw an error if the sham returns an unsuccessful response", async () => {
        const errorMessage = "error";
        fetch.mockImplementationOnce(() =>
          Promise.resolve({
            status: 417,
            text: () => Promise.resolve(errorMessage)
          }));

        await expect(
          client.not.hasBeenCalledWith(queryBuilder)
        ).rejects.toEqual(new Error(errorMessage));
      });
    });

    describe(".hasBeenLastCalledWith(queryBuilder)", () => {
      let queryBuilder;
      let query;

      beforeEach(() => {
        query = { op: "==", prop: "pathname", value: "/test" };
        queryBuilder = jest.fn(() => query);
      });

      test("it should call '/$hasbeenlastcalledwith'", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.hasBeenLastCalledWith(queryBuilder);

        expect(
          fetch
        ).toHaveBeenCalledWith(`${client.uri}/$hasbeenlastcalledwith`, {
          method: "POST",
          body: JSON.stringify(query)
        });
      });

      test("it should build the query", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.hasBeenLastCalledWith(queryBuilder);

        expect(queryBuilder).toHaveBeenCalledWith({
          and: expect.any(Function),
          or: expect.any(Function),
          not: expect.any(Function),
          equals: expect.any(Function),
          greaterThan: expect.any(Function),
          greaterThanOrEquals: expect.any(Function),
          lessThan: expect.any(Function),
          lessThanOrEquals: expect.any(Function),
          regex: expect.any(Function)
        });
      });

      test("it should use a built query if it is given", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.hasBeenLastCalledWith(query);

        expect(
          fetch
        ).toHaveBeenCalledWith(`${client.uri}/$hasbeenlastcalledwith`, {
          method: "POST",
          body: JSON.stringify(query)
        });
      });

      test("it should return true if the sham returns a successful response", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        expect(await client.hasBeenLastCalledWith(queryBuilder)).toBe(true);
      });

      test("it should throw an error if the sham returns an unsuccessful response", async () => {
        const errorMessage = "error";
        fetch.mockImplementationOnce(() =>
          Promise.resolve({
            status: 417,
            text: () => Promise.resolve(errorMessage)
          }));

        await expect(
          client.hasBeenLastCalledWith(queryBuilder)
        ).rejects.toEqual(new Error(errorMessage));
      });
    });

    describe(".not.hasBeenLastCalledWith(queryBuilder)", () => {
      let queryBuilder;
      let query;

      beforeEach(() => {
        query = { op: "==", prop: "pathname", value: "/test" };
        queryBuilder = jest.fn(() => query);
      });

      test("it should call '/$not/hasbeenlastcalledwith'", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.not.hasBeenLastCalledWith(queryBuilder);

        expect(
          fetch
        ).toHaveBeenCalledWith(`${client.uri}/$not/hasbeenlastcalledwith`, {
          method: "POST",
          body: JSON.stringify(query)
        });
      });

      test("it should build the query", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.not.hasBeenLastCalledWith(queryBuilder);

        expect(queryBuilder).toHaveBeenCalledWith({
          and: expect.any(Function),
          or: expect.any(Function),
          not: expect.any(Function),
          equals: expect.any(Function),
          greaterThan: expect.any(Function),
          greaterThanOrEquals: expect.any(Function),
          lessThan: expect.any(Function),
          lessThanOrEquals: expect.any(Function),
          regex: expect.any(Function)
        });
      });

      test("it should use a built query if it is given", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await client.not.hasBeenLastCalledWith(query);

        expect(
          fetch
        ).toHaveBeenCalledWith(`${client.uri}/$not/hasbeenlastcalledwith`, {
          method: "POST",
          body: JSON.stringify(query)
        });
      });

      test("it should return true if the sham returns a successful response", async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        expect(await client.not.hasBeenLastCalledWith(queryBuilder)).toBe(true);
      });

      test("it should throw an error if the sham returns an unsuccessful response", async () => {
        const errorMessage = "error";
        fetch.mockImplementationOnce(() =>
          Promise.resolve({
            status: 417,
            text: () => Promise.resolve(errorMessage)
          }));

        await expect(
          client.not.hasBeenLastCalledWith(queryBuilder)
        ).rejects.toEqual(new Error(errorMessage));
      });
    });
  });
});
