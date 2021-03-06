import { TSESLint } from '@typescript-eslint/experimental-utils'
import rule from '../../vue/order-in-vue-options'

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('espree'),
  parserOptions: {
    // TODO: @typescript-eslint/experimental-utils does not support ES2021+
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

ruleTester.run('order-in-vue-options', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        export default {
          components: {
            Popover,
            Button,
          },
        };
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          components: {
            Button,
            Popover,
          },
        };
      `,
      options: ['components'],
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          components: {
            'my-button': Button,
            'my-popover': Popover,
          },
        };
      `,
      options: [{ name: 'components' }],
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          foo: {
            b: 'b',
            c: 'c',
            a: 'a',
          },
        };
      `,
      options: [{ name: 'foo', order: ['b', 'a'] }],
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          foo() {
            return {
              b: 'b',
              c: 'c',
              a: 'a',
            }
          },
        };
      `,
      options: ['foo'],
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          components: {
            ...component,
            Button,
          },
        };
      `,
      options: ['components'],
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        export default {
          components: {
            Popover,
            ...components,
            Button,
          },
        };
      `,
      options: ['components'],
      errors: [
        { messageId: 'order-in-vue-options' },
      ],
      output: `
        export default {
          components: {
            Button,
            Popover,
            ...components,
          },
        };
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          foo: {
            a: 'a',
            b: 'b',
            c: 'c',
          },
        };
      `,
      options: [{ name: 'foo', order: ['b', 'a'] }],
      errors: [
        { messageId: 'order-in-vue-options' },
      ],
      output: `
        export default {
          foo: {
            b: 'b',
            a: 'a',
            c: 'c',
          },
        };
      `,
    },
  ],
})
