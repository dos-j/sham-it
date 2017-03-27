const express = require("express");
const request = require("request");

function createApp(validateUri) {
  const app = express();

  app.get("/", function(req, res) {
    request(
      {
        headers: {
          Authorization: req.headers["Authorization"]
        },
        uri: validateUri,
        json: true
      },
      err => {
        if (err) {
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
