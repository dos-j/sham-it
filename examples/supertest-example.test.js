const shamIt = require("sham-it");
const createApp = require("./supertest-example");
const request = require("supertest");

describe("Example testing a webservice which depends on another webservice being mocked by sham", () => {
  let validateSham;
  let app;

  beforeAll(async () => {
    validateSham = await shamIt({
      defaultReply: {
        status: 401,
        headers: { "Content-Type": "application/json" },
        body: { valid: false }
      }
    });

    validateSham.addMatcher({
      when: ({ and, equals }) =>
        and(
          equals("method", "GET"),
          equals("pathname", "/validate"),
          equals("headers.authorization", "User-1")
        ),
      respond: { body: { valid: true } }
    });
  });

  beforeEach(() => {
    app = createApp(`${validateSham.uri}/validate`);
  });

  test("Should return valid when a request is sent with the correct authorization token", async () => {
    const res = await request(app)
      .get("/")
      .set("Authorization", "User-1")
      .expect(200);

    expect(res.text).toEqual("Valid");
  });

  test("Should return invalid when a request is sent with the incorrect autorization token", async () => {
    const res = await request(app)
      .get("/")
      .set("Authorization", "User-2")
      .expect(200);

    expect(res.text).toEqual("Invalid");
  });

  afterEach(async () => await validateSham.clear());

  afterAll(async () => await validateSham.close());
});
