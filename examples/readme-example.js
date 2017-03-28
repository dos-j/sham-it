// Step 1: Import sham-it
const shamIt = require("../sham");

(async function() {
  // Step 2: Create a new sham using the defaults
  const sham = await shamIt();

  // or...
  // create a new sham with all options
  const shamWithOptions = await shamIt({
    // ip is the IP Address that the node server powering sham will listen on
    ip: "0.0.0.0", // 0.0.0.0 is the default

    // port is the Port that the sham can be access on
    port: 9001, // If not specified portfinder (https://www.npmjs.com/package/portfinder) will find you the next available port.

    // defaultReply is used when a mocked route isn't matched
    defaultReply: {
      status: 404, // 404 is the default status of the defaultReply

      headers: { "Content-Type": "text/plain" }, // "Content-Type": "text/plain" is the default header of the defaultReply

      body: "Not Found" // "Not Found" is the default body of the default reply
    }
  });

  // Step 3: Check the properties available on the sham
  console.log(`ip: ${sham.ip}`);
  console.log(`port: ${sham.port}`);
  console.log(`listening: ${sham.listening}`);
  console.log(`calls: ${sham.calls.length}`);

  // Step 4: Mock out an endpoint
  const matcher = sham.when(
    // matcher function that is checked. (Required, will throw an error if not supplied)
    req => {
      // You could use the node built-in url module to parse the request
      const {
        pathname
      } = require("url").parse(req.url);

      return req.method === "GET" && pathname === "/a/b/c";
    },
    // Mocked response that's returned if the matcher function returns true (Required, will throw an error if not supplied)
    {
      status: 200, // Optional: Defaults to 200
      headers: { "Content-Type": "application/json" }, // Optional: Defaults to { "Content-Type": "application/json" }
      body: { my: "data" } // If an object is supplied it is automatically stringified using JSON.stringify(...)
    }

    // Optional: You can also pass in a 3rd parameter for the number of times the matcher should match. After which it will be deleted.
    // If no value is specified then the matcher will match an unlimited number of times.
  );
  console.log(matcher); // { matcher: [Function], mock: { status: ..., headers: ..., body: ... }, calls: [] }

  // Step 5: Send a request to the sham
  const request = require("request");

  // Step 6: Fire a request against the sham
  await new Promise((resolve, reject) =>
    request(
      {
        uri: `http://localhost:${sham.port}/a/b/c`,
        json: true
      },
      (err, res, body) => {
        if (err) return reject(err);

        const statusCode = res.statusCode;
        const contentType = res.headers["content-type"];

        console.log(statusCode === matcher.mock.status); // true
        console.log(contentType === matcher.mock.headers["Content-Type"]); // true

        console.log(body.my === matcher.mock.body.my); // true

        resolve(body);
      }
    ));
  // You can also now see the call in either the matcher's list of calls or the sham's list of calls
  console.log(matcher.calls.length); // 1
  console.log(sham.calls.length); // 1

  // In your tests you can expect that sham received the correct request by doing (jest example)

  // expect(matcher.calls).toContainEqual(
  //    expect.objectContaining({
  //        request: expect.objectContaining({
  //            method: "GET",
  //            url: "/a/b/c"
  //        })
  //    })
  //);

  // Step 7: Reset the mocked routes and calls
  sham.reset();
  console.log(sham.calls); // 0

  // Step 8: Close the sham to stop it listening
  sham.close();
  shamWithOptions.close();
  console.log(`listening: ${sham.listening}`);
})();
