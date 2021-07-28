import { TSESLint } from '@typescript-eslint/experimental-utils'
import rule from '../../src/rules/multi-branch-curly'

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('espree'),
  parserOptions: {
    // TODO: @typescript-eslint/experimental-utils does not support ES2021+
    ecmaVersion: 2020,
  },
})

ruleTester.run('multi-branch-curly', rule, {
  valid: [
    {
      code: `if (foo) bar()`,
    },
    {
      code: `if (foo) { bar() } else { baz() }`,
    },
  ],
  invalid: [
    {
      code: `if (foo) bar(); else baz()`,
      errors: [
        { messageId: 'multi-branch-curly' },
        { messageId: 'multi-branch-curly' },
      ],
      output: `if (foo) { bar(); } else { baz() }`,
    },
    {
      code: `function demo() { if (foo) { bar() } else return }`,
      errors: [
        { messageId: 'multi-branch-curly' },
      ],
      output: `function demo() { if (foo) { bar() } else { return } }`,
    },
    {
      code: `if (foo) { baz() } else if (bar) qux(); else { quux() }`,
      errors: [
        // Both in the first IfStatement and in the second
        { messageId: 'multi-branch-curly' },
        { messageId: 'multi-branch-curly' },
      ],
      output: `if (foo) { baz() } else if (bar) { qux(); } else { quux() }`,
    },
  ],
})
