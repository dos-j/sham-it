module.exports = function reply(res, { status = 200, headers, body }) {
  if (body && typeof body !== "string" && typeof body !== "number") {
    res.writeHead(status, headers || { "Content-Type": "application/json" });
    return res.end(JSON.stringify(body));
  }
  if (typeof body === "undefined") {
    res.writeHead(status, headers || {});
    return res.end();
  }

  res.writeHead(status, headers || { "Content-Type": "text/plain" });
  return res.end(body);
};
