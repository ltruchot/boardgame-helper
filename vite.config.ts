import { defineConfig } from "vite-plus";

// Workspace root: format, lint and staged checks for every package (Vite+ ignores nested
// lint/fmt blocks). Rules are errors, warnings fail the run, and a rule is never relaxed to make
// code pass: the code changes instead.
export default defineConfig({
  staged: {
    // In order: tools/guard rejects secrets and personal data, then format and lint fixes apply.
    "*": ["vpx tools/guard/src/bin/scan-staged.ts", "vp check --fix"],
  },
  fmt: {},
  lint: {
    plugins: ["eslint", "typescript", "unicorn", "oxc", "import", "promise", "node", "vitest"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    categories: {
      correctness: "error",
      suspicious: "error",
      pedantic: "error",
      perf: "error",
    },
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",

      // Types: no escape hatch from the type checker.
      "typescript/no-explicit-any": "error",
      "typescript/no-non-null-assertion": "error",
      "typescript/no-unsafe-type-assertion": "error",
      "typescript/ban-ts-comment": "error",
      "typescript/explicit-function-return-type": "error",
      "typescript/explicit-module-boundary-types": "error",
      "typescript/consistent-type-imports": "error",
      "typescript/consistent-type-definitions": ["error", "type"],
      "typescript/switch-exhaustiveness-check": "error",
      "typescript/strict-boolean-expressions": "error",
      "typescript/no-unnecessary-condition": "error",
      "typescript/use-unknown-in-catch-callback-variable": "error",
      "typescript/no-namespace": "error",
      "typescript/no-import-type-side-effects": "error",
      // Inferred callback parameters (RegExpExecArray, ...), DOM nodes and events cannot be made deeply
      // readonly; every other parameter must be.
      "typescript/prefer-readonly-parameter-types": [
        "error",
        {
          ignoreInferredTypes: true,
          allow: [{ from: "lib", name: ["Element", "HTMLElement", "HTMLButtonElement", "Event"] }],
        },
      ],

      // Code shape.
      eqeqeq: "error",
      "no-var": "error",
      "prefer-const": "error",
      "no-param-reassign": ["error", { props: true }],
      "no-console": "error",
      "no-alert": "error",
      "no-debugger": "error",
      "no-eval": "error",
      "no-nested-ternary": "error",
      "no-else-return": "error",
      curly: "error",
      "max-depth": ["error", 3],
      "max-params": ["error", 4],
      complexity: ["error", 10],
      "max-lines-per-function": ["error", 50],
      "max-lines": ["error", 300],
      "unicorn/filename-case": ["error", { case: "kebabCase" }],
      "unicorn/no-abusive-eslint-disable": "error",
      "import/no-cycle": "error",
      "import/no-default-export": "error",
      // CSS imports are side effects by design (Vite bundles them).
      "import/no-unassigned-import": ["error", { allow: ["**/*.css"] }],
    },
    overrides: [
      {
        // Tool configs are loaded through their default export.
        files: ["**/vite.config.ts"],
        rules: { "import/no-default-export": "off" },
      },
      {
        // Command-line tools report to the terminal.
        files: ["tools/**/src/bin/*.ts"],
        rules: { "no-console": "off" },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
      denyWarnings: true,
      reportUnusedDisableDirectives: "error",
    },
  },
  run: {
    // Script caching tracks file access, and the tracker cannot spawn statically linked binaries
    // (tsgolint, the TypeScript 7 `tsc`): they fail with EBUSY. Scripts run uncached.
    cache: { scripts: false, tasks: true },
  },
});
