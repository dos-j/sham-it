const createMatcher = require("./createMatcher");

jest.mock("shortid", () => {
  const shortid = {
    generate: jest.fn(() => shortid.__id),
    __id: "Xe2ds3"
  };

  return shortid;
});
const shortid = require("shortid");

describe("unit: createMatcher", () => {
  let handler;
  let matcherStore;
  let matcher;

  beforeEach(() => {
    matcher = {
      when: {},
      respond: {}
    };

    matcherStore = [
      {
        id: "1"
      },
      {
        id: "2"
      },
      {
        id: "3"
      }
    ];

    handler = createMatcher(matcherStore);
  });

  test("it should return the created", () => {
    expect(handler(matcher)).toHaveProperty(
      "body",
      expect.objectContaining(matcher)
    );
  });

  test("it should set the id on the matcher", () => {
    const created = handler(matcher);

    expect(created.body).toHaveProperty("id", shortid.__id);
  });

  test("it should return a status of 200", () => {
    expect(handler(matcher)).toHaveProperty("status", 200);
  });

  test("it should return 400 if there is no matcher", () => {
    const response = handler();

    expect(response).toHaveProperty("status", 400);
    expect(response).toHaveProperty(
      "body",
      "The matcher definition must be an object"
    );
  });

  test("it should return 400 if the matcher is not an object", () => {
    const response = handler(2);

    expect(response).toHaveProperty("status", 400);
    expect(response).toHaveProperty(
      "body",
      "The matcher definition must be an object"
    );
  });

  test("it should return 400 if the when property does not exist", () => {
    const response = handler({});

    expect(response).toHaveProperty("status", 400);
    expect(response).toHaveProperty(
      "body",
      "The matcher must contain a valid when property"
    );
  });

  test("it should return 400 if the when property is not an object", () => {
    const response = handler({ when: "bob" });

    expect(response).toHaveProperty("status", 400);
    expect(response).toHaveProperty(
      "body",
      "The matcher must contain a valid when property"
    );
  });

  test("it should return 400 if the respond property is not an object", () => {
    const response = handler({
      when: { op: "==", prop: "pathname", value: "/test" }
    });

    expect(response).toHaveProperty("status", 400);
    expect(response).toHaveProperty(
      "body",
      "The matcher must contain a valid respond property"
    );
  });

  test("it should return 400 if the respond property is not an object", () => {
    const response = handler({
      when: { op: "==", prop: "pathname", value: "/test" },
      respond: "bob"
    });

    expect(response).toHaveProperty("status", 400);
    expect(response).toHaveProperty(
      "body",
      "The matcher must contain a valid respond property"
    );
  });
});
