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
    // Shorthand is not empty
    {
      filename: 'test.vue',
      code: `
        export default {
          components,
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
        {
          messageId: 'no-empty-vue-options',
          suggestions: [
            {
              messageId: 'suggestion@no-empty-vue-options.remove',
              output: `
        export default {
        }
      `,
            },
          ],
        },
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
        {
          messageId: 'no-empty-vue-options',
          suggestions: [
            {
              messageId: 'suggestion@no-empty-vue-options.remove',
              output: `
        export default {
        }
      `,
            },
          ],
        },
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
        {
          messageId: 'no-empty-vue-options',
          suggestions: [
            {
              messageId: 'suggestion@no-empty-vue-options.remove',
              output: `
        export default {
        }
      `,
            },
          ],
        },
      ],
    },
  ],
})
