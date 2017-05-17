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
  const close = jest.fn(() => {
    server.listening = false;
  });
  const on = jest.fn();
  const listen = jest.fn(port => {
    server.listening = true;
    server.__port = port || serverCreator.__port;
    on.mock.calls
      .filter(args => args[0] === "listening")
      .forEach(([, func]) => func());
  });
  const server = {
    listen,
    close,
    on,
    listening: false,
    address: () => ({ port: server.__port })
  };
  const serverCreator = jest.fn(() => server);
  serverCreator.__server = server;
  serverCreator.__port = 8001;

  return serverCreator;
});
const serverCreator = require("./server/serverCreator");

describe("unit: shamIt", () => {
  beforeEach(() => {
    serverCreator.mockClear();
    serverCreator.__server.close.mockClear();
    serverCreator.__server.listen.mockClear();
    serverCreator.__server.on.mockClear();
    shamClient.mockClear();
    shamBuilder.mockClear();
  });

  describe("Creating a Service", () => {
    test("it should ask the serverCreator to create a server", async () => {
      await shamIt();

      expect(serverCreator).toHaveBeenCalled();
    });

    test("it should ask the server to listen for requests", async () => {
      await shamIt();

      expect(serverCreator.__server.listen).toHaveBeenCalled();
    });
  });

  describe("Choosing a Port", () => {
    test("it should ask the server to use the Port provided", async () => {
      const port = 8888;
      await shamIt({ port });

      expect(serverCreator.__server.listen).toHaveBeenCalledWith(port);
    });

    test("it should throw an error if the port is already in use", async () => {
      serverCreator.__server.listen.mockImplementationOnce(() => {
        throw new Error("Port already in use");
      });

      await expect(shamIt({ port: 8000 })).rejects.toEqual(
        new Error("Port already in use")
      );
    });
  });

  describe("Building the sham", () => {
    test("it should ask shamBuilder to build the sham", async () => {
      await shamIt();

      expect(shamBuilder).toHaveBeenCalled();
    });

    test("it should use the sham to handle all requests to the server", async () => {
      await shamIt();

      expect(serverCreator.__server.on).toHaveBeenCalledWith(
        "request",
        shamBuilder.__sham
      );
    });

    test("it should pass the server and defaultReply to the shamBuilder", async () => {
      const defaultReply = { status: 404 };

      await shamIt({ defaultReply });

      expect(shamBuilder).toHaveBeenCalledWith(
        serverCreator.__server,
        defaultReply
      );
    });
  });

  describe("Deciding the protocol", () => {
    test("it should use http by default", async () => {
      await shamIt();

      expect(serverCreator).toHaveBeenCalledWith(undefined);
    });

    test("it should use https if the https option is set", async () => {
      const https = {
        key: "key.pem",
        cert: "cert.pem"
      };
      await shamIt({ https });

      expect(serverCreator).toHaveBeenCalledWith(https);
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
});
