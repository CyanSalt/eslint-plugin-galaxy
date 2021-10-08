import rule from '../../src/rules/no-unsafe-window-open'
import { ruleTester } from '../tester'

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
