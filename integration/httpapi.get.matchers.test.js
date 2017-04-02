const shamIt = require("sham-it");
const url = require("url");
const fetch = require("node-fetch");

let sham;

describe("Integration: HTTP API GET /$matchers", () => {
  beforeEach(async () => {
    sham = await shamIt();
  });
  afterEach(() => {
    sham.close();
  });

  test("It should return an empty array if there are no matchers", async () => {
    const response = await fetch(`http://localhost:${sham.port}/$matchers`);
    const body = await response.json();

    expect(response).toHaveProperty("status", 200);
    expect(body).toHaveLength(0);
  });

  test("it should return a single registered matcher", async () => {
    const matcher = sham.when(
      req => {
        const { pathname } = url.parse(req.url);
        return pathname === "/a";
      },
      {
        status: 418,
        headers: { "Content-Type": "text/plain" },
        body: "a"
      }
    );

    const response = await fetch(`http://localhost:${sham.port}/$matchers`);
    const body = await response.json();

    expect(response).toHaveProperty("status", 200);
    expect(body).toHaveLength(1);

    expect(body).toContainEqual({
      id: matcher.id,
      when: matcher.matcher.toString(),
      respond: matcher.mock
    });
  });

  test("it should fill in the defaults on the matcher", async () => {
    const matcher = sham.when(
      req => {
        const { pathname } = url.parse(req.url);
        return pathname === "/a";
      },
      {
        body: "a"
      }
    );

    const response = await fetch(`http://localhost:${sham.port}/$matchers`);
    const body = await response.json();

    expect(response).toHaveProperty("status", 200);
    expect(body).toHaveLength(1);

    expect(body).toContainEqual({
      id: matcher.id,
      when: matcher.matcher.toString(),
      respond: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: matcher.mock.body
      }
    });
  });

  test("it should return multiple registered matchers", async () => {
    const matcherA = sham.when(
      req => {
        const { pathname } = url.parse(req.url);
        return pathname === "/a";
      },
      { body: "a" }
    );

    const matcherB = sham.when(
      req => {
        const { pathname } = url.parse(req.url);
        return pathname === "/c";
      },
      { body: "c" }
    );

    const matcherC = sham.when(
      req => {
        const { pathname } = url.parse(req.url);
        return pathname === "/f";
      },
      { body: "f" }
    );

    const response = await fetch(`http://localhost:${sham.port}/$matchers`);
    const body = await response.json();

    expect(response).toHaveProperty("status", 200);
    expect(body).toHaveLength(3);

    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: matcherA.id
        })
      ])
    );

    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: matcherB.id
        })
      ])
    );

    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: matcherC.id
        })
      ])
    );
  });
});
