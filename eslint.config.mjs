import globals from "globals";

const sharedRules = {
  eqeqeq: ["error", "always"],
  "no-eval": "error",
  "no-implied-eval": "error",
  "no-new-func": "error",
  "no-constant-binary-expression": "error",
  "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]
};

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      ".playwright-mcp/**",
      "index_reconstructed.html"
    ]
  },
  {
    files: ["script.js", "src/**/*.js", "sites/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser
    },
    rules: sharedRules
  },
  {
    files: [
      "api/**/*.js",
      "scripts/**/*.mjs",
      "tests/**/*.js",
      "tests/**/*.mjs",
      "playwright.config.js"
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node
    },
    rules: sharedRules
  }
];
