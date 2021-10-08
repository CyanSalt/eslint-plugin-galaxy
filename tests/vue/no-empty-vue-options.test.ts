import rule from '../../src/vue/no-empty-vue-options'
import { ruleTester } from '../tester'

ruleTester.run('no-empty-vue-options', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        export default {
          components: {
            Popover,
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          components: {
            // pass
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          created() {
            // pass
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          methods: {},
        }
      `,
      options: [{ ignores: ['methods'] }],
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        export default {
          methods: {},
        }
      `,
      errors: [
        { messageId: 'no-empty-vue-options' },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          created() {},
        }
      `,
      errors: [
        { messageId: 'no-empty-vue-options' },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          created: () => {},
        }
      `,
      errors: [
        { messageId: 'no-empty-vue-options' },
      ],
    },
  ],
})
