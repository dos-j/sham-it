const shutdown = require("./shutdown");

describe("unit: shutdown", () => {
  let server;
  beforeEach(() => {
    server = { close: jest.fn() };

    handler = shutdown(server);
  });

  it("should close the server", () => {
    handler();

    expect(server.close).toHaveBeenCalled();
  });

  test("it should return a status of 204", () => {
    expect(handler()).toHaveProperty("status", 204);
  });
});
