import rule from '../../src/rules/valid-indexof-return'
import { ruleTester } from '../tester'

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
        {
          messageId: 'valid-indexof-return',
          suggestions: [
            {
              messageId: 'suggestion@valid-indexof-return.includes',
              output: `if (arr.includes(x)) {}`,
            },
          ],
        },
      ],
    },
    {
      code: `arr.indexOf(x) ? foo : bar`,
      errors: [
        {
          messageId: 'valid-indexof-return',
          suggestions: [
            {
              messageId: 'suggestion@valid-indexof-return.includes',
              output: `arr.includes(x) ? foo : bar`,
            },
          ],
        },
      ],
    },
    {
      code: `arr.indexOf(x) && arr.map(item => item.id)`,
      errors: [
        {
          messageId: 'valid-indexof-return',
          suggestions: [
            {
              messageId: 'suggestion@valid-indexof-return.includes',
              output: `arr.includes(x) && arr.map(item => item.id)`,
            },
          ],
        },
      ],
    },
  ],
})
