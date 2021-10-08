import { TSESLint } from '@typescript-eslint/experimental-utils'

export const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('espree'),
  parserOptions: {
    ecmaVersion: require('espree').latestEcmaVersion,
    sourceType: 'module',
  },
})
