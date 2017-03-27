const request = require("request");

function createService(baseUri) {
  return {
    async getItem(id) {
      return await new Promise((resolve, reject) =>
        request(
          {
            method: "GET",
            uri: `${baseUri}/item/${id}`,
            json: true
          },
          (err, res, body) => {
            if (err) return reject(err);
            resolve(body);
          }
        ));
    }
  };
}

module.exports = createService;
