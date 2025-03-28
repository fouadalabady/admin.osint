export default {
  root: true,
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_",
      "caughtErrorsIgnorePattern": "^_"
    }],
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-misused-promises": "off",
    "@typescript-eslint/ban-ts-comment": "warn",
    "@typescript-eslint/ban-types": "warn",
    "@typescript-eslint/no-unnecessary-condition": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-return": "off"
  },
  overrides: [
    {
      files: ["**/*.test.js", "**/*.test.jsx", "**/*.test.ts", "**/*.test.tsx"],
      env: {
        "jest": true
      }
    },
    {
      files: [
        "app/api/auth/register/route.ts",
        "app/dashboard/layout.tsx",
        "app/dashboard/users/page.tsx",
        "app/debug/session/page.tsx"
      ],
      rules: {
        "@typescript-eslint/no-unused-vars": "off"
      }
    }
  ],
  ignorePatterns: [
    "node_modules/",
    ".next/",
    "out/",
    "public/",
    "*.d.ts"
  ]
} 