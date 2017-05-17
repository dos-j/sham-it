const serverCreator = require("./serverCreator");

jest.mock("http", () => {
  const http = {
    Server: jest.fn(() => http.__server),
    __server: { builtBy: "http" }
  };

  return http;
});
const http = require("http");

jest.mock("https", () => {
  const https = {
    Server: jest.fn(() => https.__server),
    __server: { builtBy: "https" }
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
  beforeEach(() => {
    https.Server.mockClear();
    http.Server.mockClear();
    fs.readFileSync.mockClear();
  });

  describe("Creating a Http Server", () => {
    test("it should create a http server", () => {
      serverCreator();

      expect(http.Server).toHaveBeenCalledWith();
    });

    test("it should return the http server", () => {
      const server = serverCreator();

      expect(server).toBe(http.__server);
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

    test("it should not create a https server if no https config is provided", () => {
      serverCreator();

      expect(https.Server).not.toHaveBeenCalledWith();
    });

    test("it should create a https server if https config is provided", () => {
      serverCreator(httpsOptions);

      expect(https.Server).toHaveBeenCalledWith(httpsOptions);
    });

    test("it should not create a http server if https config is provided", () => {
      serverCreator(httpsOptions);

      expect(http.Server).not.toHaveBeenCalled();
    });

    test("it should return the https server", () => {
      const server = serverCreator(httpsOptions);

      expect(server).toBe(https.__server);
    });

    test("it should not read the pem and cert file if it does not end in the correct extension", () => {
      serverCreator({
        cert: "cert",
        key: "key"
      });

      expect(fs.readFileSync).not.toHaveBeenCalled();

      expect(https.Server).toHaveBeenCalledWith({
        cert: "cert",
        key: "key"
      });
    });

    test("it should automatically read the pem and cert file if specified", () => {
      serverCreator({
        cert: "cert.pem",
        key: "key.pem"
      });

      expect(fs.readFileSync).toHaveBeenCalledWith("cert.pem");
      expect(fs.readFileSync).toHaveBeenCalledWith("key.pem");

      expect(https.Server).toHaveBeenCalledWith({
        cert: fs.__files["cert.pem"],
        key: fs.__files["key.pem"]
      });
    });

    test("it should throw an error if the pem and cert file cannot be read", () => {
      const error = new Error("Test");

      fs.readFileSync.mockImplementationOnce(() => {
        throw error;
      });

      expect(() => serverCreator({ cert: "cert.pem", key: "key.pem" })).toThrow(
        error
      );
    });

    test("it should not read the pfx file if it does not end in the correct extension", () => {
      serverCreator({
        pfx: "cert",
        passphrase: "sample"
      });

      expect(fs.readFileSync).not.toHaveBeenCalled();

      expect(https.Server).toHaveBeenCalledWith({
        pfx: "cert",
        passphrase: "sample"
      });
    });

    test("it should automatically read the pfx file if specified", () => {
      serverCreator({
        pfx: "cert.pfx",
        passphrase: "sample"
      });

      expect(fs.readFileSync).toHaveBeenCalledWith("cert.pfx");

      expect(https.Server).toHaveBeenCalledWith({
        pfx: fs.__files["cert.pfx"],
        passphrase: "sample"
      });
    });

    test("it should throw an error if the pfx file cannot be read", () => {
      const error = new Error("Test");

      fs.readFileSync.mockImplementationOnce(() => {
        throw error;
      });

      expect(() =>
        serverCreator({
          pfx: "cert.pfx",
          passphrase: "sample"
        })).toThrow(error);
    });
  });
});
