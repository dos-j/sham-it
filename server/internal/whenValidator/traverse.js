module.exports = function traverse(request, prop) {
  function find(target, [head, ...tail]) {
    if (!target) {
      return;
    }

    if (tail.length > 0) {
      return find(target[head], tail);
    }

    return target[head];
  }

  if (prop.startsWith("request.")) {
    prop = prop.substr("request.".length);
  }

  return find(request, prop.split("."));
};
