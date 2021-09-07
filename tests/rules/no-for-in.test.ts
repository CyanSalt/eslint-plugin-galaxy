import { TSESLint } from '@typescript-eslint/experimental-utils'
import rule from '../../src/rules/no-for-in'

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('espree'),
  parserOptions: {
    // TODO: @typescript-eslint/experimental-utils does not support ES2021+
    ecmaVersion: 2020,
  },
})

ruleTester.run('no-for-in', rule, {
  valid: [
    {
      code: `
        for (let key of Object.keys(foo)) {
          bar[key] = String(foo[key]);
        }
      `,
    },
    {
      code: `
        Object.keys(foo).forEach(key => {
          bar[key] = String(foo[key]);
        });
      `,
    },
  ],
  invalid: [
    {
      code: `
        for (let key in foo) {
          bar[key] = String(foo[key]);
        }
      `,
      errors: [
        { messageId: 'no-for-in' },
      ],
    },
    {
      code: `
        for (let key in foo) {
          if (Object.prototype.hasOwnProperty.call(foo, key)) {
            bar[key] = String(foo[key]);
          }
        }
      `,
      errors: [
        { messageId: 'no-for-in' },
      ],
    },
  ],
})
