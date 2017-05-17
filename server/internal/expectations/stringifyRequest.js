const qs = require("querystring");
const indent = require("./indentText");

function toQueryString(query) {
  const string = qs.stringify(query);

  if (string) {
    return `?${string}`;
  }

  return "";
}

module.exports = ({ request }) =>
  `\n${request.method} ${request.pathname}${toQueryString(request.query)}${Object.entries(
    request.headers || {}
  )
    .map(([key, value]) => `\n  ${key}: ${value}`)
    .join()}${request.body ? indent(`\nbody:
    ${typeof request.body === "object" ? JSON.stringify(request.body) : request.body}`, 2) : ""}`;
