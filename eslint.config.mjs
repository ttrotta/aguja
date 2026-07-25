import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const CONSTITUTION_MESSAGE =
  "domain/ must stay framework-free (Constitution Principle III). Pass plain data across the feature boundary instead — see specs/001-rag-chunking-debugger/contracts/domain-api.md.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Principle III: no domain/ file may import a framework, a UI library,
    // or another layer's impure code. Enforced mechanically, not by review —
    // paired with the DOM-less Node test environment in vitest.config.ts,
    // which catches runtime reach-through this static check cannot see.
    files: ["**/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "react", message: CONSTITUTION_MESSAGE },
            { name: "react-dom", message: CONSTITUTION_MESSAGE },
            { name: "@huggingface/transformers", message: CONSTITUTION_MESSAGE },
          ],
          patterns: [
            { group: ["next", "next/*"], message: CONSTITUTION_MESSAGE },
            {
              group: ["**/ui/**", "**/app/**", "**/embedding/**"],
              message: CONSTITUTION_MESSAGE,
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
