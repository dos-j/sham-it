const shamIt = require("sham-it");

jest.mock("./server/shamBuilder", () => {
  const spy = jest.fn(() => spy.__sham);
  spy.__sham = { builtBy: "shamBuilder" };

  return spy;
});
const shamBuilder = require("./server/shamBuilder");

jest.mock("./client/shamClient", () => {
  const spy = jest.fn(() => spy.__client);
  spy.__client = { buildBy: "shamClient" };

  return spy;
});
const shamClient = require("./client/shamClient");

jest.mock("./server/serverCreator", () => {
  const server = {
    address: () => ({ port: server.__port })
  };
  const serverCreator = jest.fn((builder, { port }) => {
    builder(server);
    server.__port = port || serverCreator.__port;
    return server;
  });
  serverCreator.__server = server;
  serverCreator.__port = 8001;

  return serverCreator;
});
const serverCreator = require("./server/serverCreator");

jest.mock("pino", () => {
  const pino = jest.fn(() => pino.__instance);
  pino.__instance = { info() {}, error() {} };

  return pino;
});
const pino = require("pino");

describe("unit: shamIt", () => {
  beforeEach(() => {
    serverCreator.mockClear();
    shamClient.mockClear();
    shamBuilder.mockClear();
    pino.mockClear();
  });

  describe("Creating a Service", () => {
    test("it should ask the serverCreator to create a server", async () => {
      await shamIt();

      expect(serverCreator).toHaveBeenCalledWith(expect.any(Function), {
        port: 0,
        https: undefined
      });
    });

    test("it should call the shamBuilder when creating the server", async () => {
      await shamIt();

      expect(shamBuilder).toHaveBeenCalledWith(
        serverCreator.__server,
        undefined,
        pino.__instance
      );
    });
  });

  describe("Choosing a Port", () => {
    test("it should ask the server to use the Port provided", async () => {
      const port = 8888;
      await shamIt({ port });

      expect(serverCreator).toHaveBeenCalledWith(expect.any(Function), {
        port,
        https: undefined
      });
    });

    test("it should throw an error if the port is already in use", async () => {
      serverCreator.mockImplementationOnce(() => {
        throw new Error("Port already in use");
      });

      await expect(shamIt({ port: 8000 })).rejects.toEqual(
        new Error("Port already in use")
      );
    });
  });

  describe("Using a default reply", () => {
    test("it should pass the defaultReply to the shamBuilder", async () => {
      const defaultReply = { status: 404 };

      await shamIt({ defaultReply });

      expect(shamBuilder).toHaveBeenCalledWith(
        expect.anything(),
        defaultReply,
        expect.anything()
      );
    });
  });

  describe("Deciding the protocol", () => {
    test("it should use http by default", async () => {
      await shamIt();

      expect(serverCreator).toHaveBeenCalledWith(expect.any(Function), {
        https: undefined,
        port: expect.any(Number)
      });
    });

    test("it should use https if the https option is set", async () => {
      const https = {
        key: "key.pem",
        cert: "cert.pem"
      };
      await shamIt({ https });

      expect(serverCreator).toHaveBeenCalledWith(expect.any(Function), {
        https,
        port: expect.any(Number)
      });
    });
  });

  describe("Creating a client", () => {
    test("it should create a shamClient with the default port and http", async () => {
      await shamIt();

      expect(shamClient).toHaveBeenCalledWith({
        port: serverCreator.__port,
        https: false
      });
    });

    test("it should create a shamClient with a custom port and http", async () => {
      const https = {
        key: "key.pem",
        cert: "cert.pem"
      };
      await shamIt({ port: 8000, https });

      expect(shamClient).toHaveBeenCalledWith({ port: 8000, https: true });
    });

    test("it should return the shamClient", async () => {
      const sham = await shamIt();

      expect(sham).toBe(shamClient.__client);
    });
  });

  describe("Using a logger", () => {
    test("it should use the pino logger if one is not provided", async () => {
      await shamIt();

      expect(pino).toHaveBeenCalled();
      expect(shamBuilder).toHaveBeenCalledWith(
        expect.anything(),
        undefined,
        pino.__instance
      );
    });

    test("it should not use the pino logger if one is provided", async () => {
      const logger = { info() {} };
      await shamIt({ logger });

      expect(pino).not.toHaveBeenCalled();
      expect(shamBuilder).toHaveBeenCalledWith(
        expect.anything(),
        undefined,
        logger
      );
    });
  });
});
