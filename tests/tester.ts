import { TSESLint } from '@typescript-eslint/experimental-utils'
import { latestEcmaVersion } from 'espree'

export const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('espree'),
  parserOptions: {
    ecmaVersion: latestEcmaVersion,
    sourceType: 'module',
  },
})

export const vueRuleTester = new TSESLint.RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: {
    ecmaVersion: latestEcmaVersion,
    sourceType: 'module',
  },
})
