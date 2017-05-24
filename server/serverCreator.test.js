const serverCreator = require("./serverCreator");

jest.mock("http", () => {
  const http = {
    Server: jest.fn(() => http.__server),
    __server: {
      builtBy: "http",
      on: jest.fn(),
      listen: jest.fn(() =>
        http.__server.on.mock.calls
          .filter(([key]) => key === "listening")
          .forEach(([, handler]) => handler())
      )
    }
  };

  return http;
});
const http = require("http");

jest.mock("https", () => {
  const https = {
    Server: jest.fn(() => https.__server),
    __server: {
      builtBy: "https",
      on: jest.fn(),
      listen: jest.fn(() =>
        https.__server.on.mock.calls
          .filter(([key]) => key === "listening")
          .forEach(([, handler]) => handler())
      )
    }
  };

  return https;
});
const https = require("https");

jest.mock("fs", () => {
  const fs = {
    readFileSync: jest.fn(filepath => {
      return (fs.__files[filepath] = `ndonio1ehdihdi12d2...${filepath}`);
    }),
    __files: []
  };

  return fs;
});
const fs = require("fs");

describe("unit: serverCreator", () => {
  let handler;
  let builder;

  beforeEach(() => {
    https.Server.mockClear();
    http.Server.mockClear();
    fs.readFileSync.mockClear();

    handler = jest.fn();
    builder = jest.fn(() => handler);
  });

  describe("Creating a Http Server", () => {
    test("it should create a http server", async () => {
      await serverCreator(builder);

      expect(http.Server).toHaveBeenCalledWith();
    });

    test("it should return the http server", async () => {
      const server = await serverCreator(builder);

      expect(server).toBe(http.__server);
    });
  });

  describe("Building a handler", () => {
    test("it should call the builder function", async () => {
      await serverCreator(builder);

      expect(builder).toHaveBeenCalled();
    });

    test("it should call the builder with the server", async () => {
      const server = await serverCreator(builder);

      expect(builder).toHaveBeenCalledWith(server);
    });
  });

  describe("Handling requests", () => {
    test("it should call the handler when the server receives a request", async () => {
      const server = await serverCreator(builder);

      expect(server.on).toHaveBeenCalledWith("request", handler);
    });
  });

  describe("Starting the server", () => {
    test("it should start listening for requests", async () => {
      const server = await serverCreator(builder);

      expect(server.listen).toHaveBeenCalledWith(undefined);
    });

    test("it should listen on a given port if provided", async () => {
      const port = 8342;
      const server = await serverCreator(builder, { port });

      expect(server.listen).toHaveBeenCalledWith(port);
    });
  });

  describe("Creating a Https Server", () => {
    let httpsOptions;
    beforeEach(() => {
      httpsOptions = {
        cert: "fij23odji2d3...",
        pem: "tr0f2fjejd2c..."
      };
    });

    test("it should not create a https server if no https config is provided", async () => {
      await serverCreator(builder);

      expect(https.Server).not.toHaveBeenCalledWith();
    });

    test("it should create a https server if https config is provided", async () => {
      await serverCreator(builder, { https: httpsOptions });

      expect(https.Server).toHaveBeenCalledWith(httpsOptions);
    });

    test("it should not create a http server if https config is provided", async () => {
      await serverCreator(builder, { https: httpsOptions });

      expect(http.Server).not.toHaveBeenCalled();
    });

    test("it should return the https server", async () => {
      const server = await serverCreator(builder, { https: httpsOptions });

      expect(server).toBe(https.__server);
    });

    test("it should not read the pem and cert file if it does not end in the correct extension", async () => {
      await serverCreator(builder, {
        https: {
          cert: "cert",
          key: "key"
        }
      });

      expect(fs.readFileSync).not.toHaveBeenCalled();

      expect(https.Server).toHaveBeenCalledWith({
        cert: "cert",
        key: "key"
      });
    });

    test("it should automatically read the pem and cert file if specified", async () => {
      await serverCreator(builder, {
        https: {
          cert: "cert.pem",
          key: "key.pem"
        }
      });

      expect(fs.readFileSync).toHaveBeenCalledWith("cert.pem");
      expect(fs.readFileSync).toHaveBeenCalledWith("key.pem");

      expect(https.Server).toHaveBeenCalledWith({
        cert: fs.__files["cert.pem"],
        key: fs.__files["key.pem"]
      });
    });

    test("it should throw an error if the pem and cert file cannot be read", async () => {
      const error = new Error("Test");

      fs.readFileSync.mockImplementationOnce(() => {
        throw error;
      });

      await expect(
        serverCreator(builder, { https: { cert: "cert.pem", key: "key.pem" } })
      ).rejects.toBe(error);
    });

    test("it should not read the pfx file if it does not end in the correct extension", async () => {
      await serverCreator(builder, {
        https: {
          pfx: "cert",
          passphrase: "sample"
        }
      });

      expect(fs.readFileSync).not.toHaveBeenCalled();

      expect(https.Server).toHaveBeenCalledWith({
        pfx: "cert",
        passphrase: "sample"
      });
    });

    test("it should automatically read the pfx file if specified", async () => {
      await serverCreator(builder, {
        https: {
          pfx: "cert.pfx",
          passphrase: "sample"
        }
      });

      expect(fs.readFileSync).toHaveBeenCalledWith("cert.pfx");

      expect(https.Server).toHaveBeenCalledWith({
        pfx: fs.__files["cert.pfx"],
        passphrase: "sample"
      });
    });

    test("it should throw an error if the pfx file cannot be read", async () => {
      const error = new Error("Test");

      fs.readFileSync.mockImplementationOnce(() => {
        throw error;
      });

      await expect(
        serverCreator(builder, {
          https: {
            pfx: "cert.pfx",
            passphrase: "sample"
          }
        })
      ).rejects.toBe(error);
    });
  });
});
