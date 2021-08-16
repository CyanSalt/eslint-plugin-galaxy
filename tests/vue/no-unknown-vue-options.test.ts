import { TSESLint } from '@typescript-eslint/experimental-utils'
import rule from '../../src/vue/no-unknown-vue-options'

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('espree'),
  parserOptions: {
    // TODO: @typescript-eslint/experimental-utils does not support ES2021+
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

ruleTester.run('no-unknown-vue-options', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        export default {
          components: {},
        }
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          fetch() {},
        }
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          foo: {},
        }
      `,
      options: [{ allows: ['foo'] }],
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        export default {
          foo: {},
        }
      `,
      errors: [
        { message: 'Unknown option: "foo"' } as any,
      ],
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          bar() {},
        }
      `,
      errors: [
        { message: 'Unknown option: "bar"' } as any,
      ],
    },
  ],
})
