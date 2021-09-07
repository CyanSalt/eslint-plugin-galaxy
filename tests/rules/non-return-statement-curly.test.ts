import { TSESLint } from '@typescript-eslint/experimental-utils'
import rule from '../../src/rules/non-return-statement-curly'

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('espree'),
  parserOptions: {
    // TODO: @typescript-eslint/experimental-utils does not support ES2021+
    ecmaVersion: 2020,
  },
})

ruleTester.run('non-return-statement-curly', rule, {
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
  ],
  invalid: [
    {
      code: `if (foo) bar();`,
      errors: [
        { messageId: 'non-return-statement-curly' },
      ],
      output: `if (foo) { bar(); }`,
    },
  ],
})
