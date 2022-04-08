import rule from '../../src/vue/no-invalid-vue-inject-keys'
import { ruleTester } from '../tester'

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
        {
          messageId: 'no-invalid-vue-inject-keys',
          data: {
            name: 'bar',
          },
        },
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
        {
          messageId: 'no-invalid-vue-inject-keys',
          data: {
            name: 'baz',
          },
        },
      ],
    },
  ],
})
