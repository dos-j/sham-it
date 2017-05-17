const http = require("http");
const https = require("https");
const fs = require("fs");

module.exports = function serverCreator(httpsOptions) {
  if (httpsOptions) {
    const parsedOptions = Object.assign({}, httpsOptions);

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
  return new http.Server();
};
