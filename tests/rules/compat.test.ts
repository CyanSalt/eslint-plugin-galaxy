import rule from '../../src/rules/compat'
import { ruleTester } from '../tester'

ruleTester.run('compat', rule, {
  valid: [
    {
      code: `
        const regexp = /(?=abc)/
      `,
      options: [
        { browserslist: 'chrome 61' },
      ],
    },
    {
      code: `
        const regexp = /(?<=abc)/
      `,
      options: [
        { browserslist: 'chrome 62' },
      ],
    },
    {
      code: `
        navigator.geolocation.getCurrentPosition(callback)
      `,
      options: [
        { browserslist: 'firefox 62' },
      ],
    },
    {
      code: `
        navigator.clipboard.write(data)
      `,
      options: [
        { browserslist: 'firefox 63' },
      ],
    },
  ],
  invalid: [
    {
      code: `
        const regexp = /(?<=abc)/
      `,
      options: [
        { browserslist: 'chrome 61' },
      ],
      errors: [
        {
          messageId: 'compat',
          data: {
            feature: 'Lookbehind in JS regular expressions',
            env: 'Chrome >=62',
          },
        },
      ],
    },
    {
      code: `
        navigator.clipboard.write(data)
      `,
      options: [
        { browserslist: 'firefox 62' },
      ],
      errors: [
        {
          messageId: 'compat',
          data: {
            feature: 'Asynchronous Clipboard API',
            env: 'Firefox >=63',
          },
        },
      ],
    },
  ],
})
