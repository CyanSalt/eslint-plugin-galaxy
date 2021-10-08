import rule from '../../src/rules/max-nested-destructuring'
import { ruleTester } from '../tester'

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
