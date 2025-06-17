module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    // THIS IS THE CRITICAL FIX:
    // It tells ESLint to ignore variables that start with an underscore `_`.
    '@typescript-eslint/no-unused-vars': [
      'error', // or 'warn'
      {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrorsIgnorePattern': '^_',
      },
    ],

    // Optional: A rule to prevent the "require() is forbidden" error if you ever need it.
    // For now, we will keep it off since you are using `import`.
    '@typescript-eslint/no-require-imports': 'error',
  },
};