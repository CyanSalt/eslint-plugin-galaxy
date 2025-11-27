import tseslintParser from '@typescript-eslint/parser'
import { RuleTester } from '@typescript-eslint/rule-tester'
import { RuleTester as LegacyRuleTester } from 'eslint'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import { afterAll, describe, it } from 'vitest'
import vueEslintParser from 'vue-eslint-parser'

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it

LegacyRuleTester['describe'] = describe
LegacyRuleTester['it'] = it

export {
  RuleTester,
}

export const ruleTester = new RuleTester()

export const tsRuleTester = new RuleTester({
  languageOptions: {
    parser: tseslintParser,
  },
  settings: {
    'import-x/resolver-next': [
      createTypeScriptImportResolver(),
    ],
    'import-x/parsers': {
      [require.resolve('@typescript-eslint/parser')]: ['.ts'],
    },
  },
})

export const vueRuleTester = new RuleTester({
  languageOptions: {
    parser: vueEslintParser,
    parserOptions: {
      parser: {
        ts: require.resolve('@typescript-eslint/parser'),
      },
    },
  },
})
