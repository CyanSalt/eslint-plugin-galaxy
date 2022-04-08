import rule from '../../src/rules/no-for-in'
import { ruleTester } from '../tester'

ruleTester.run('no-for-in', rule, {
  valid: [
    {
      code: `
        for (let key of Object.keys(foo)) {
          bar[key] = String(foo[key])
        }
      `,
    },
    {
      code: `
        Object.keys(foo).forEach(key => {
          bar[key] = String(foo[key])
        })
      `,
    },
  ],
  invalid: [
    {
      code: `
        for (let key in foo) {
          bar[key] = String(foo[key])
        }
      `,
      errors: [
        {
          messageId: 'no-for-in',
          suggestions: [
            {
              messageId: 'suggestion@no-for-in.for-of-keys',
              output: `
        for (let key of Object.keys(foo)) {
          bar[key] = String(foo[key])
        }
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
        for (let key in foo) {
          if (Object.prototype.hasOwnProperty.call(foo, key)) {
            bar[key] = String(foo[key])
          }
        }
      `,
      errors: [
        {
          messageId: 'no-for-in',
          suggestions: [
            {
              messageId: 'suggestion@no-for-in.for-of-keys',
              output: `
        for (let key of Object.keys(foo)) {
          if (Object.prototype.hasOwnProperty.call(foo, key)) {
            bar[key] = String(foo[key])
          }
        }
      `,
            },
          ],
        },
      ],
    },
  ],
})
