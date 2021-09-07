import { TSESLint } from '@typescript-eslint/experimental-utils'
import rule from '../../src/rules/valid-indexof-return'

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('espree'),
  parserOptions: {
    // TODO: @typescript-eslint/experimental-utils does not support ES2021+
    ecmaVersion: 2020,
  },
})

ruleTester.run('valid-indexof-return', rule, {
  valid: [
    {
      code: `if (arr.indexOf(x) !== -1) {}`,
    },
    {
      code: `arr.includes(x) ? foo : bar`,
    },
    {
      code: `arr.indexOf(x) + offset`,
    },
  ],
  invalid: [
    {
      code: `if (arr.indexOf(x)) {}`,
      errors: [
        { messageId: 'valid-indexof-return' },
      ],
    },
    {
      code: `arr.indexOf(x) ? foo : bar`,
      errors: [
        { messageId: 'valid-indexof-return' },
      ],
    },
    {
      code: `arr.indexOf(x) && arr.map(item => item.id)`,
      errors: [
        { messageId: 'valid-indexof-return' },
      ],
    },
  ],
})
