import eslint from "@eslint/js";
import globals from "globals";
import { builtinModules } from "node:module";
import tseslint from "typescript-eslint";

const TYPESCRIPT_FILES = [
  "apps/api/src/**/*.ts",
  "apps/api/tests/**/*.ts",
  "apps/web/src/**/*.{ts,tsx}",
  "packages/contracts/src/**/*.ts",
];

export default [
  {
    ignores: [
      "reference/**",
      ".task-checks/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/.local/**",
      "**/.next/**",
      "**/next-env.d.ts",
      "**/coverage/**",
      ".husky/_/**",
    ],
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      ...eslint.configs.recommended.rules,
    },
  },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: TYPESCRIPT_FILES,
  })),
  {
    files: TYPESCRIPT_FILES,
    rules: {
      curly: ["error", "all"],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["apps/api/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./apps/api/tsconfig.test.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./apps/web/tsconfig.test.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@social-media/backend",
            "@social-media/backend/*",
            "@social-media/api",
            "@social-media/api/*",
            "@social-media/worker",
            "@social-media/worker/*",
            "**/packages/backend/**",
            "**/apps/api/**",
            "**/apps/worker/**",
            "@nestjs/*",
            "@temporalio/*",
          ],
        },
      ],
    },
  },
  {
    files: ["packages/contracts/src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./packages/contracts/tsconfig.test.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["packages/contracts/src/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@social-media/backend",
            "@social-media/backend/*",
            "@social-media/api",
            "@social-media/api/*",
            "@social-media/web",
            "@social-media/web/*",
            "@social-media/worker",
            "@social-media/worker/*",
            "**/apps/**",
            "**/backend/**",
            "@nestjs/*",
            "@temporalio/*",
            "next",
            "next/*",
            "react",
            "react/*",
            "react-dom",
            "react-dom/*",
            ...builtinModules,
            "node:*",
          ],
        },
      ],
    },
  },
];
