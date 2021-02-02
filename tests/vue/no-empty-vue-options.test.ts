import { TSESLint } from '@typescript-eslint/experimental-utils'
import rule from '../../vue/no-empty-vue-options'

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('espree'),
  parserOptions: {
    // TODO: @typescript-eslint/experimental-utils does not support ES2021+
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

ruleTester.run('no-empty-vue-options', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        export default {
          components: {
            Popover,
          },
        };
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          components: {
            // pass
          },
        };
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          created() {
            // pass
          },
        };
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          methods: {},
        };
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
        };
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
        };
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
        };
      `,
      errors: [
        { messageId: 'no-empty-vue-options' },
      ],
    },
  ],
})
