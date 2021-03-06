function expect() {
  return { toBe() {} };
}

// Step 1: Import sham-it
const shamIt = require("../index");

(async function() {
  // Step 2: Create a new sham using the defaults
  const sham = await shamIt();

  // or...
  // create a new sham with all options
  const shamWithOptions = await shamIt({
    // port is the Port that the sham can be access on
    port: 9001, // If not specified then one will be chosen automatically

    // defaultReply is used when a mocked route isn't matched
    defaultReply: {
      status: 404, // 404 is the default status of the defaultReply

      headers: { "Content-Type": "text/plain" }, // "Content-Type": "text/plain"
      // is the default header of the defaultReply

      body: "Not Found" // "Not Found" is the default body of the default reply
    }
  });

  // Step 3: Get the uri for the Sham
  console.log(`The uri is a property on the Sham Client: ${sham.uri}`); // http://localhost:8000

  // Step 4: Mock out an endpoint
  const matcher = await sham.addMatcher({
    // when is a function for building a matcher. (Required, will throw an error if not supplied)
    when: ({ and, equals }) =>
      and(equals("method", "GET"), equals("pathname", "/a/b/c")),

    // Mocked response that's returned if the matcher function returns true
    // (Required, will throw an error if not supplied)
    respond: {
      status: 200, // Optional: Defaults to 200
      headers: { "Content-Type": "application/json" }, // Optional: Defaults to { "Content-Type": "application/json" }
      body: { my: "data" } // If an object is supplied it is automatically stringified using JSON.stringify(...)
    }

    // Optional: You can also pass in a 3rd parameter for the number of times the matcher should match.
    // After which it will be deleted, if no value is specified then the matcher will match an unlimited number of times.
  });
  console.log(matcher); // { id: "...", when: {...}, respond: { status: ..., headers: {...}, body: {...} } }

  // Step 5: Send a request to the sham
  const fetch = require("node-fetch");

  const response = await fetch(`${sham.uri}/a/b/c`);

  console.log(response.status === matcher.respond.status); // true
  console.log(
    response.headers.get("Content-Type") ===
      matcher.respond.headers["Content-Type"]
  ); // true

  const body = await response.json();
  console.log(body.my === matcher.respond.body.my); // true

  // You can also now see the call by calling getRequest();
  console.log(await sham.getRequests()); // [{ request: {...}, matcher: {...}, response: {...} }]

  // Step 6: In your tests you can expect that the sham received the correct request by doing
  expect(
    await sham.hasBeenCalledWith(({ and, equals }) =>
      and(equals("method", "GET"), equals("pathname", "/a/b/c"))
    )
  ).toBe(true);
  // If the expectation fails you will receive full details about the reason why similar to when
  // you call expect(jest.fn()).toHaveBeenCalledWith(...)

  // Step 7: Reset the mocked routes and calls
  await sham.reset();
  console.log(await sham.getRequests()); // []

  // Step 8: Close the sham to stop it listening
  await sham.close();
  await shamWithOptions.close();
})();
