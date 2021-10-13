import { TSESLint } from '@typescript-eslint/experimental-utils'

export const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('espree'),
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
})

export const vueRuleTester = new TSESLint.RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
})
