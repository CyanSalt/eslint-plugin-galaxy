import rule from '../../src/vue/require-vue-default-inject'
import { vueRuleTester } from '../tester'

vueRuleTester.run('require-vue-default-inject', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        export default {
          inject: {
            foo: {
              default: undefined,
            },
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
              default: () => [],
            },
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      code: `
        const foo = inject('foo', false)
      `,
    },
    {
      filename: 'test.vue',
      code: `
        const foo = inject('foo', () => [])
      `,
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          inject: ['foo'],
        }
        </script>
      `,
      errors: [
        {
          messageId: 'require-vue-default-inject',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          inject: {
            foo: {
              from: 'bar',
            },
          },
        }
        </script>
      `,
      errors: [
        {
          messageId: 'require-vue-default-inject',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script setup>
        const foo = inject('foo')
        </script>
      `,
      errors: [
        {
          messageId: 'require-vue-default-inject',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script setup>
        const foo = inject('foo') ?? bar()
        </script>
      `,
      errors: [
        {
          messageId: 'require-vue-default-inject',
        },
      ],
      output: `
        <script setup>
        const foo = inject('foo', bar())
        </script>
      `,
    },
  ],
})
