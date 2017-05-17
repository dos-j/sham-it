const required = () => {
  throw new Error("A length parameter is required.");
};
module.exports = (text, length = required()) =>
  text
    .split(/\n/gm)
    .map(
      line =>
        line.length === 0
          ? ""
          : `${[...(function*() {
                for (let i = 0; i < length; i++) {
                  yield " ";
                }
              })()].join("")}${line}`
    )
    .join("\n");
