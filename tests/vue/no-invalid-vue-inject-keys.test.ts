import { TSESLint } from '@typescript-eslint/experimental-utils'
import rule from '../../src/vue/no-invalid-vue-inject-keys'

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('espree'),
  parserOptions: {
    // TODO: @typescript-eslint/experimental-utils does not support ES2021+
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

ruleTester.run('no-invalid-vue-inject-keys', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        export default {
          inject: {
            foo: {
              default: '',
            },
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          props: {
            foo: {
              from: 'bar',
            },
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          inject: ['foo'],
        }
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          inject: {
            ...injections,
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          inject: {
            foo: {
              from: 'bar',
              default: '',
              comment: 'Foo from parent',
            },
          },
        }
      `,
      options: [{ allows: ['comment'] }],
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        export default {
          inject: {
            foo: {
              bar: 1,
            },
          },
        }
      `,
      errors: [
        { message: 'Invalid key "bar" in inject options' } as any,
      ],
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          inject: {
            foo: {
              baz() {},
            },
          },
        }
      `,
      errors: [
        { message: 'Invalid key "baz" in inject options' } as any,
      ],
    },
  ],
})
