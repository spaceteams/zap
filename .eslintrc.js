module.exports = {
  env: {
    browser: true,
  },
  globals: {
    process: true,
    module: true,
  },
  root: true,
  extends: ["eslint:recommended", "plugin:unicorn/recommended"],
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 6,
    requireConfigFile: false,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true,
    },
  },
  rules: {
    curly: "error",
    "unicorn/prevent-abbreviations": 0,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      parserOptions: {
        project: "./tsconfig.json",
      },
      extends: [
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", ignoreRestSiblings: true },
        ],
        "@typescript-eslint/no-explicit-any": 2,
        "@typescript-eslint/no-non-null-assertion": 2,
      },
    },
  ],
};
