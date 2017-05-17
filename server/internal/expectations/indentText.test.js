const indent = require("./indentText");

describe("unit: indent", () => {
  test("it should throw an error if you forget to pass in the amount of characters to indent by", () => {
    expect(() => indent("")).toThrow(
      new Error("A length parameter is required.")
    );
  });

  test("it should prefix each line with the number of spaces specified", () => {
    expect(
      indent(
        `a
b
c
d`,
        2
      )
    ).toEqual(
      `  a
  b
  c
  d`
    );

    expect(
      indent(
        `a
b
c
d`,
        4
      )
    ).toEqual(
      `    a
    b
    c
    d`
    );
  });

  test("it should not indent an empty line", () => {
    expect(
      indent(
        `
a

b

c

d`,
        2
      )
    ).toEqual(
      `
  a

  b

  c

  d`
    );
  });
});
