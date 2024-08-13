import tseslintParser from '@typescript-eslint/parser'
import { RuleTester } from '@typescript-eslint/rule-tester'
import { RuleTester as LegacyRuleTester } from 'eslint'

export const ruleTester = new RuleTester()

export const tsRuleTester = new RuleTester({
  languageOptions: {
    parser: tseslintParser,
  },
  settings: {
    'import-x/resolver': {
      [require.resolve('eslint-import-resolver-typescript')]: {},
    },
    'import-x/parsers': {
      [require.resolve('@typescript-eslint/parser')]: ['.ts'],
    },
  },
})

export const vueRuleTester = new LegacyRuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: {
    parser: {
      ts: require.resolve('@typescript-eslint/parser'),
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
} as never)
