const express = require("express");
const request = require("request");

function createApp(validateUri) {
  const app = express();

  app.get("/", function(req, res) {
    request(
      {
        headers: {
          Authorization: req.headers["authorization"]
        },
        uri: validateUri,
        json: true
      },
      (err, res2) => {
        if (err || res2.statusCode !== 200) {
          res.end("Invalid");
        } else {
          res.end("Valid");
        }
      }
    );
  });

  return app;
}

module.exports = createApp;
