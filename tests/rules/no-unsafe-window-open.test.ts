import { TSESLint } from '@typescript-eslint/experimental-utils'
import rule from '../../src/rules/no-unsafe-window-open'

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('espree'),
  parserOptions: {
    // TODO: @typescript-eslint/experimental-utils does not support ES2021+
    ecmaVersion: 2020,
  },
})

ruleTester.run('no-unsafe-window-open', rule, {
  valid: [
    {
      code: `window.open(location.href, '_blank', 'noopener')`,
    },
    {
      code: `window.open(location.href, '_blank', '')`,
    },
  ],
  invalid: [
    {
      code: `window.open(location.href)`,
      errors: [
        { messageId: 'no-unsafe-window-open' },
      ],
      output: `window.open(location.href, '_blank', 'noopener')`,
    },
    {
      code: `window.open(location.href, '_blank')`,
      errors: [
        { messageId: 'no-unsafe-window-open' },
      ],
      output: `window.open(location.href, '_blank', 'noopener')`,
    },
    {
      code: `const child = window.open(location.href)`,
      errors: [
        { messageId: 'no-unsafe-window-open' },
      ],
      output: null,
    },
  ],
})
