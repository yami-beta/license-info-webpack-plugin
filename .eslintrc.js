module.exports = {
  env: {
    node: true,
    commonjs: true,
    es6: true,
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  rules: {
    "no-undef": "off",
    "no-unused-vars": "off",
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
  },
};
