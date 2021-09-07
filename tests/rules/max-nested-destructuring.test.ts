import { TSESLint } from '@typescript-eslint/experimental-utils'
import rule from '../../src/rules/max-nested-destructuring'

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('espree'),
  parserOptions: {
    // TODO: @typescript-eslint/experimental-utils does not support ES2021+
    ecmaVersion: 2020,
  },
})

ruleTester.run('max-nested-destructuring', rule, {
  valid: [
    {
      code: `const { foo: { bar: { baz } } } = qux;`,
    },
    {
      code: `const { foo: { bar: baz } } = qux;`,
      options: [{ max: 2 }],
    },
  ],
  invalid: [
    {
      code: `const { foo: { bar: [{ baz }] } } = qux;`,
      errors: [
        { messageId: 'max-nested-destructuring' },
      ],
    },
    {
      code: `const { foo: { bar: { baz } } } = qux;`,
      errors: [
        { messageId: 'max-nested-destructuring' },
      ],
      options: [{ max: 2 }],
    },
  ],
})
