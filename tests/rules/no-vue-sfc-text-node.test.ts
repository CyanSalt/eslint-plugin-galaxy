import rule from '../../src/vue/no-vue-sfc-text-node'
import { vueRuleTester } from '../tester'

vueRuleTester.run('no-vue-sfc-text-node', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        <script setup></script>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <script setup></script>
        <!-- Foo -->
      `,
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        <script setup></script>
        Foo
      `,
      errors: [
        { messageId: 'no-vue-sfc-text-node' },
      ],
    },
    {
      code: `
        <script setup></script>
        /* Foo */
      `,
      errors: [
        { messageId: 'no-vue-sfc-text-node' },
      ],
      output: `
        <script setup></script>
        <!-- /* Foo */ -->
      `,
    },
  ],
})
