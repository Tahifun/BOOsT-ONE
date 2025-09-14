import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  // Global ignores (inkl. ESLint-Config selbst)
  { ignores: ['**/node_modules/**','**/dist/**','**/build/**','**/coverage/**','.*/**','eslint.config.*'] },

  // Basis: JS-Empfehlungen
  js.configs.recommended,

  // JS/CJS/MJS als Node laufen lassen (process/console vorhanden)
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2021 },
    },
    rules: {
      'no-console': 'off',
      // Sicherheitsnetz, falls irgendwo noch anschlägt:
      'no-undef': 'off',
    },
  },

  // TS (Backend) — typed linting, laute Regeln vorerst OFF für Baseline
  ...tseslint.configs.recommendedTypeChecked.map(cfg => ({
    ...cfg,
    files: ['backend/**/*.{ts,tsx}'],
    languageOptions: {
      ...cfg.languageOptions,
      parserOptions: {
        ...(cfg.languageOptions?.parserOptions ?? {}),
        project: ['./backend/tsconfig.json'],
        tsconfigRootDir: process.cwd(),
      },
      globals: { ...globals.node, ...globals.es2021 },
    },
    rules: {
      ...cfg.rules,
      // Baseline-Entschärfung:
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-misused-promises': ['off', { checksVoidReturn: false }],
      '@typescript-eslint/no-floating-promises': 'off',
    },
  })),

  // TS (Frontend)
  ...tseslint.configs.recommendedTypeChecked.map(cfg => ({
    ...cfg,
    files: ['frontend/**/*.{ts,tsx}'],
    languageOptions: {
      ...cfg.languageOptions,
      parserOptions: {
        ...(cfg.languageOptions?.parserOptions ?? {}),
        project: ['./frontend/tsconfig.json'],
        tsconfigRootDir: process.cwd(),
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser, ...globals.es2021 },
    },
    rules: {
      ...cfg.rules,
      // Baseline-Entschärfung:
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-misused-promises': ['off', { checksVoidReturn: false }],
      '@typescript-eslint/no-floating-promises': 'off',
    },
  })),

  // Dev- und Tooling-Skripte extra locker
  {
    files: ['scripts/**/*.{js,cjs,mjs}','tools/**/*.{js,cjs,mjs}'],
    languageOptions: { globals: { ...globals.node, ...globals.es2021 } },
    rules: { 'no-console': 'off', 'no-undef': 'off' },
  },
];
