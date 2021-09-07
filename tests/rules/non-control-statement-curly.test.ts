import { TSESLint } from '@typescript-eslint/experimental-utils'
import rule from '../../src/rules/non-control-statement-curly'

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('espree'),
  parserOptions: {
    // TODO: @typescript-eslint/experimental-utils does not support ES2021+
    ecmaVersion: 2020,
  },
})

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
