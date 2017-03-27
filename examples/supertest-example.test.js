const sham = require("sham-server");
const createApp = require("./supertest-example");
const request = require("supertest");

describe("Example testing a webservice which depends on another webservice being mocked by sham", () => {
  let validateServer;
  let app;

  beforeAll(async () => {
    validateServer = await sham({
      defaultReply: {
        status: 401,
        headers: { "Content-Type": "application/json" },
        body: { valid: false }
      }
    });

    validateServer.when(
      req =>
        req.method === "GET" &&
        req.url === "/validate" &&
        req.headers.authorization === "User-1",
      { body: { valid: true } }
    );
  });

  beforeEach(() => {
    app = createApp(`http://localhost:${validateServer.port}/validate`);
  });

  test("Should return valid when a request is sent with the correct autorization token", async () => {
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

  afterAll(() => validateServer.close());
});
