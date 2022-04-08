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
        {
          messageId: 'no-invalid-vue-prop-keys',
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
          props: {
            foo: {
              type: Object,
              baz() {},
            },
          },
        }
      `,
      errors: [
        {
          messageId: 'no-invalid-vue-prop-keys',
          data: {
            name: 'baz',
          },
        },
      ],
    },
  ],
})
