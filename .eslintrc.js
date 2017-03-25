module.exports = {
  env: {
    es6: true,
    node: true
  },
  extends: ["prettier"],
  parserOptions: {
    ecmaVersion: 2017
  },
  rules: {
    // Possible Errors
    "no-new-func": "error",
    "no-cond-assign": "error",
    "no-constant-condition": ["error", { checkLoops: false }],
    "no-control-regex": "error",
    "no-debugger": "error",
    "no-dupe-args": "error",
    "no-dupe-keys": "error",
    "no-duplicate-case": "error",
    "no-empty-character-class": "error",
    "no-ex-assign": "error",
    "no-extra-boolean-cast": "error",
    "no-func-assign": "error",
    "no-inner-declarations": "error",
    "no-invalid-regexp": "error",
    "no-obj-calls": "error",
    "no-regex-spaces": "error",
    "no-unreachable": "error",
    "no-unsafe-finally": "error",
    "no-unsafe-negation": "error",
    "use-isnan": "error",
    "valid-typeof": ["error", { requireStringLiterals: true }],

    // Best Practices
    "no-empty-pattern": "error",
    "no-fallthrough": "error",
    "no-global-assign": "error",
    "no-octal": "error",
    "no-redeclare": "error",
    "no-self-assign": "error",
    "no-unused-labels": "error",
    "no-useless-return": "error",
    "no-delete-var": "error",
    "no-unused-vars": "error",
    yoda: "error",

    // ECMAScript 6
    "constructor-super": "error",
    "no-class-assign": "error",
    "no-const-assign": "error",
    "no-dupe-class-members": "error",
    "no-new-symbol": "error",
    "no-useless-computed-key": "error",
    "no-useless-rename": "error",
    "no-var": "error",
    "no-this-before-super": "error",
    "prefer-const": "error",
    "prefer-spread": "error",
    "prefer-template": "error",
    "sort-imports": "error",
    "require-yield": "error"
  }
};
