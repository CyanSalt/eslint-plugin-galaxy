import rule from '../../src/rules/no-misused-globals'
import { ruleTester } from '../tester'

ruleTester.run('no-misused-globals', rule, {
  valid: [
    {
      code: `
        location.href = ''
        setTimeout(foo, 1000)
        process.exit()
        require('os')
      `,
    },
  ],
  invalid: [
    {
      code: `
        if (hasOwnProperty('foo')) {}
      `,
      errors: [
        {
          messageId: 'no-misused-globals.prototype-builtins',
        },
      ],
    },
    {
      code: `
        event.target.focus()
      `,
      errors: [
        {
          messageId: 'no-misused-globals.deprecated',
        },
      ],
    },
    {
      code: `
        onbeforeunload = () => false
      `,
      errors: [
        {
          messageId: 'no-misused-globals.events',
        },
      ],
    },
    {
      code: `
        open(door)
      `,
      errors: [
        {
          messageId: 'no-misused-globals.ambiguous-single-words',
        },
      ],
    },
  ],
})
