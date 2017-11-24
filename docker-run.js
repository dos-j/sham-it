const shamIt = require("./");

(async () => {
  const server = await shamIt({
    port: process.env.PORT || 80
  });

  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });
})();
