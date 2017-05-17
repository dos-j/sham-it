const shamIt = require("sham-it");
const factory = require("./request-example");

describe("Testing an example service that uses request", () => {
  let sham;
  let service;
  let matcher;

  beforeAll(async () => {
    sham = await shamIt();
  });

  beforeEach(async () => {
    service = factory(sham.uri);

    matcher = await sham.addMatcher({
      when: ({ and, equals }) =>
        and(equals("method", "GET"), equals("pathname", "/item/12345")),
      respond: {
        body: {
          id: 12345,
          data: "TEST"
        }
      }
    });
  });

  test("it retrieves the item from the sham", async () => {
    await service.getItem(12345);

    expect(
      await sham.hasBeenCalledWith(({ and, equals }) =>
        and(equals("method", "GET"), equals("pathname", "/item/12345")))
    ).toBe(true);
  });

  test("it gets a single item from the api", async () => {
    const result = await service.getItem(12345);

    expect(result).toEqual(matcher.respond.body);
  });

  afterEach(async () => {
    await sham.reset();
  });

  afterAll(async () => {
    await sham.close();
  });
});
