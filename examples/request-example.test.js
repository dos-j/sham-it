const sham = require("sham-server");
const factory = require("./request-example");
const url = require("url");

describe("Testing an example service that uses request", () => {
  let server;
  beforeAll(async () => {
    server = await sham();
  });

  beforeEach(() => {
    service = factory(`http://localhost:${server.port}`);
  });

  test("it gets a single item from the api", async () => {
    const matcher = server.when(
      req => {
        const { pathname } = url.parse(req.url);

        return req.method === "GET" && pathname === "/item/12345";
      },
      {
        body: {
          id: 12345,
          data: "TEST"
        }
      }
    );

    const result = await service.getItem(12345);

    expect(matcher.calls).toContainEqual(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "GET",
          url: "/item/12345"
        })
      })
    );
    expect(result).toEqual(matcher.mock.body);
  });

  afterEach(() => {
    server.reset();
  });

  afterAll(() => {
    server.close();
  });
});
