import rule from '../../src/rules/non-control-statement-curly'
import { ruleTester } from '../tester'

ruleTester.run('non-control-statement-curly', rule, {
  valid: [
    {
      code: `
        if (foo) {
          bar();
        }
      `,
    },
    {
      code: `function demo() { if (foo) return; }`,
    },
    {
      code: `if (foo) throw new Error('An error occurred.')`,
    },
  ],
  invalid: [
    {
      code: `if (foo) bar();`,
      errors: [
        { messageId: 'non-control-statement-curly' },
      ],
      output: `if (foo) { bar(); }`,
    },
  ],
})
