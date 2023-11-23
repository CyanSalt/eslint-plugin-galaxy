import { TSESLint } from '@typescript-eslint/utils'

export const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('espree'),
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
})

export const tsRuleTester = new TSESLint.RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    'import/resolver': {
      typescript: {
        extensions: ['.ts', '.js'],
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },
  },
})

export const vueRuleTester = new TSESLint.RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: {
    parser: {
      ts: require.resolve('@typescript-eslint/parser'),
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
})
