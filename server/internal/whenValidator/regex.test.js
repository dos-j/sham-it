const regex = require("./regex");

jest.mock("./traverse", () => jest.fn(() => undefined));
const traverse = require("./traverse");

describe("unit: regex", () => {
  let request;
  let prop;

  beforeEach(() => {
    request = { pathname: "/user/a2423-b2sd2-35csd-c32sd/roles" };
    prop = "pathname";

    traverse.mockClear();
    traverse.mockImplementationOnce(() => request.pathname);
  });

  test("it should traverse the request to get the correct property", () => {
    regex(request, prop, [".*", "g"]);

    expect(traverse).toHaveBeenCalledWith(request, prop);
  });

  test("it should return true with a catch all regex", () => {
    expect(regex(request, prop, [".*", "g"])).toBe(true);
  });

  test("it should return true with a specific regex", () => {
    expect(regex(request, prop, ["/user/[^/]+/roles$"])).toBe(true);
  });

  test("it should return false with a specific regex that doesn`t match", () => {
    expect(regex(request, prop, ["/user/[^/]+/keys$"])).toBe(false);
  });
});
