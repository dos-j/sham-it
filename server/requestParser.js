const url = require("url");

module.exports = async function requestParser(request) {
  const { pathname, query } = url.parse(decodeURIComponent(request.url), true);
  const { headers, method } = request;
  const data = await new Promise((resolve, reject) => {
    let data = "";
    request
      .on("error", err => reject(err))
      .on("data", chunk => (data += chunk))
      .on("end", () => resolve(data));
  });

  let body;
  if (data.length > 0) {
    if (
      (data.startsWith("{") && data.endsWith("}")) ||
      (data.startsWith("[") && data.endsWith("]"))
    ) {
      body = JSON.parse(data);
    }
  }
  body = body || data;

  return { pathname, headers, query, method, body };
};
