import rule from '../../src/vue/no-invalid-vue-prop-keys'
import { ruleTester } from '../tester'

ruleTester.run('no-invalid-vue-prop-keys', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        export default {
          props: {
            foo: {
              type: String,
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
              type: Object,
              required: true,
            },
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          props: ['foo'],
        }
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          props: {
            ...properties,
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
              type: Object,
              required: true,
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
          props: {
            foo: {
              type: Object,
              bar: 1,
            },
          },
        }
      `,
      errors: [
        { message: 'Invalid key "bar" in props options' } as any,
      ],
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          props: {
            foo: {
              type: Object,
              baz() {},
            },
          },
        }
      `,
      errors: [
        { message: 'Invalid key "baz" in props options' } as any,
      ],
    },
  ],
})
