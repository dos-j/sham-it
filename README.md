# sham-server
[![Build Status](https://circleci.com/gh/dos-j/sham-server.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/dos-j/sham-server) [![Coverage](https://img.shields.io/codecov/c/github/dos-j/sham-server.svg)](https://codecov.io/gh/dos-j/sham-server) [![dependencies](https://david-dm.org/dos-j/sham-server.svg)](https://david-dm.org/dos-j/sham-server) [![devDependencies](https://david-dm.org/dos-j/sham-server/dev-status.svg)](https://david-dm.org/dos-j/sham-server#info=devDependencies) [![Known Vulnerabilities](https://snyk.io/test/github/dos-j/sham-server/badge.svg)](https://snyk.io/test/github/dos-j/sham-server) [![License](https://img.shields.io/badge/licence-MIT-000000.svg?style=flat-square)](https://github.com/dos-j/sham-server/blob/master/LICENSE)

Sham-Server allows you to easily create mock webservices that you can use for integration testing.

## Getting Started

First intall the npm module:
```
npm install sham-server
```

Then in JavaScript follow the steps below to create a sham-server, mock out and endpoint, call it then check it was called.
```js
// Step 1: Import sham-server
const sham = require("sham-server");

// Step 2: Create a new sham server using the defaults
const server = await sham();

// or...
// create a new sham server with all options
const serverWithOptions = await sham({

    // ip is the IP Address that the node server powering sham will listen on
    ip: "0.0.0.0", // 0.0.0.0 is the default

    // port is the Port that the sham server can be access on
    port: 9001, // If not specified portfinder (https://www.npmjs.com/package/portfinder) will find you the next available port.

    // defaultReply is used when a mocked route isn't matched
    defaultReply: {

        status: 404, // 404 is the default status of the defaultReply

        headers: { "Content-Type": "text/plain" }, // "Content-Type": "text/plain" is the default header of the defaultReply

        body: "Not Found" // "Not Found" is the default body of the default reply

    }
});

// Step 3: Check the properties available on the sham server
const {
    ip,
    port, // This is the important one!
    listening,
    calls
} = server;

// Step 4: Mock out an endpoint
const matcher = server.when(
    // matcher function that is checked. (Required, will throw an error if not supplied)
    req => {
        console.log(req); // This is the request which sham server receives

        // You could use the node built-in url module to parse the request
        const {
            href,
            search,
            query,
            pathname
        } = require("url").parse(req.url);

        return req.method === "GET" &&
                pathname === "/a/b/c"
    },

    // Mocked response that's returned if the matcher function returns true (Required, will throw an error if not supplied)
    {
        status: 200, // Optional: Defaults to 200
        headers: { "Content-Type": "application/json" } // Optional: Defaults to { "Content-Type": "application/json" }
        body: { my: "data" } // If an object is supplied it is automatically stringified using JSON.stringify(...)
    }

    // Optional: You can also pass in a 3rd parameter for the number of times the matcher should match. After which it will be deleted.
    // If no value is specified then the matcher will match an unlimited number of times.
);
console.log(matcher); // { matcher: Function (), mock: { status: ..., headers: ..., body: ... }, calls: [] }

// Step 5: Send a request to the sham server
const http = require('http');

// Step 6: Fire a request against the sham server
http.get(`http://localhost:${port}/a/b/c`, (res) => {
  const statusCode = res.statusCode;
  const contentType = res.headers['content-type'];

  console.log(statusCode === matcher.mock.status); // true
  console.log(contentType === matcher.mock.headers["Content-Type"]); // true

  res.setEncoding('utf8');
  let rawData = '';
  res.on('data', (chunk) => rawData += chunk);
  res.on('end', () => {
    let parsedData = JSON.parse(rawData);

    console.log(parsedData.my === matcher.mock.body.my); // true

    // You can also now see the call in either the matcher's list of calls or the server's list of calls
    console.log(matcher.mock.calls.length); // 1
    console.log(server.calls.length) // 1

    // In your tests you can expect that sham server received the correct request by doing (jest example)

    // expect(matcher.mock.calls).toContainEqual({
    //    expect.objectContaining({
    //        request: expect.objectContaining({
    //            method: "GET",
    //            url: "/a/b/c"
    //        })
    //    });
    //});

  });
});

// Step 7: Reset the mocked routes and calls
server.reset();
console.log(server.calls); // 0

// Step 8: Optionally close the server to stop it listening
server.close(); // Typically not required in your tests because when node exists the server will close anyway.

```

## Roadmap

Currently this project is working towards a 1.0 Release. You can see our progress [here](https://github.com/dos-j/sham-server/projects/1)

## Issues

If you find any problems with sham-server or have any feature requests please [log them here](https://github.com/dos-j/sham-server/issues?state=open).

## Contributing

Pull requests are more than welcome!

## Maintainers
* [Jason Hewison](https://github.com/JasonHewison)

## License

Licensed under [MIT](./LICENSE).

