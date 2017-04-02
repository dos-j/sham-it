const shamIt = require("sham-it");
const url = require("url");
const fetch = require("node-fetch");

let sham;

describe("Integration: HTTP API POST /$reset", () => {
  beforeEach(async () => {
    sham = await shamIt();

    sham.when(
      req => {
        const { pathname } = url.parse(req.url);
        return pathname === "/a";
      },
      { body: "a" }
    );

    sham.when(
      req => {
        const { pathname } = url.parse(req.url);
        return pathname === "/c";
      },
      { body: "c" }
    );

    sham.when(
      req => {
        const { pathname } = url.parse(req.url);
        return pathname === "/f";
      },
      { body: "f" }
    );
  });
  afterEach(() => {
    sham.close();
  });

  test("it should clear all of the logged calls", async () => {
    expect((await fetch(`http://localhost:${sham.port}/a`)).status).toBe(200);
    expect((await fetch(`http://localhost:${sham.port}/b`)).status).toBe(404);
    expect((await fetch(`http://localhost:${sham.port}/c`)).status).toBe(200);
    expect((await fetch(`http://localhost:${sham.port}/d`)).status).toBe(404);
    expect((await fetch(`http://localhost:${sham.port}/e`)).status).toBe(404);
    expect((await fetch(`http://localhost:${sham.port}/f`)).status).toBe(200);

    expect(sham.calls).toHaveLength(6);

    await fetch(`http://localhost:${sham.port}/$reset`, { method: "POST" });

    expect(sham.calls).toHaveLength(0);
  });

  test("it should clear all of the matchers", async () => {
    await fetch(`http://localhost:${sham.port}/$reset`, { method: "POST" });

    expect((await fetch(`http://localhost:${sham.port}/a`)).status).toBe(404);
    expect((await fetch(`http://localhost:${sham.port}/c`)).status).toBe(404);
    expect((await fetch(`http://localhost:${sham.port}/f`)).status).toBe(404);
  });

  test("it should return a 204 No Content", async () => {
    const res = await fetch(`http://localhost:${sham.port}/$reset`, {
      method: "POST"
    });

    expect(res.status).toBe(204);
  });
});
