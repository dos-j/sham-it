const shamIt = require("./index");

let port;
if (process.argv.length > 2) {
  port = process.argv[2];
}

shamIt({ port }).then(client =>
  console.log(`Server is running at ${client.uri}`));
