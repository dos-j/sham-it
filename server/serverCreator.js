const http = require("http");
const https = require("https");
const fs = require("fs");

module.exports = async function serverCreator(builder, opts = {}) {
  if (opts.https) {
    const parsedOptions = Object.assign({}, opts.https);

    const fileProps = [["pfx", ".pfx"], ["cert", ".pem"], ["key", ".pem"]];
    fileProps.forEach(([prop, suffix]) => {
      if (
        parsedOptions.hasOwnProperty(prop) &&
        `${parsedOptions[prop]}`.endsWith(suffix)
      ) {
        parsedOptions[prop] = fs.readFileSync(parsedOptions[prop]);
      }
    });

    return new https.Server(parsedOptions);
  }
  const server = new http.Server();

  server.on("request", builder(server));

  const promise = new Promise(resolve => {
    server.on("listening", resolve);
  });

  server.listen(opts.port);

  await promise;

  return server;
};
