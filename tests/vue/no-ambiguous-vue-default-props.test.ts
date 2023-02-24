import rule from '../../src/vue/no-ambiguous-vue-default-props'
import { vueRuleTester } from '../tester'

vueRuleTester.run('no-ambiguous-vue-default-props', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          props: {
            foo: {
              type: Object,
              default: () => ({}),
            },
          },
        }
        </script>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          props: {
            foo: {
              type: Function,
              default: () => {},
            },
          },
        }
        </script>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          props: {
            foo: {
              type: null,
              default: () => {},
            },
          },
        }
        </script>
      `,
    },
    {
      code: `
        <script setup>
        withDefaults(defineProps({
          foo: Function,
        }), {
          foo: () => {},
        })
        </script>
      `,
    },
    {
      code: `
        <script setup>
        const { foo = () => {} } = defineProps({
          foo: [Function],
        })
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        withDefaults(defineProps<{
          foo?: () => void
        }>(), {
          foo: () => {},
        })
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo = () => {} } = defineProps<{
          foo?: any
        }>()
        </script>
      `,
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          props: {
            foo: {
              type: Object,
              default: () => {},
            },
          },
        }
        </script>
      `,
      errors: [
        { messageId: 'no-ambiguous-vue-default-props' },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          props: {
            foo: {
              type: Object,
              default: () => {},
            },
          },
        }
        </script>
      `,
      options: [{ fixStyle: 'remove' }],
      errors: [
        { messageId: 'no-ambiguous-vue-default-props' },
      ],
      output: `
        <script>
        export default {
          props: {
            foo: {
              type: Object,
            },
          },
        }
        </script>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          props: {
            foo: {
              type: Object,
              default: () => {},
            },
          },
        }
        </script>
      `,
      options: [{ fixStyle: 'match-type' }],
      errors: [
        { messageId: 'no-ambiguous-vue-default-props' },
      ],
      output: `
        <script>
        export default {
          props: {
            foo: {
              type: Object,
              default: () => ({}),
            },
          },
        }
        </script>
      `,
    },
    {
      code: `
        <script setup>
        withDefaults(defineProps({
          foo: Object,
        }), {
          foo: () => {},
        })
        </script>
      `,
      errors: [
        { messageId: 'no-ambiguous-vue-default-props' },
      ],
    },
    {
      code: `
        <script setup>
        withDefaults(defineProps({
          foo: Object,
        }), {
          foo: () => {},
        })
        </script>
      `,
      options: [{ fixStyle: 'remove' }],
      errors: [
        { messageId: 'no-ambiguous-vue-default-props' },
      ],
      output: `
        <script setup>
        withDefaults(defineProps({
          foo: Object,
        }), {
        })
        </script>
      `,
    },
    {
      code: `
        <script setup>
        withDefaults(defineProps({
          foo: Object,
        }), {
          foo: () => {},
        })
        </script>
      `,
      options: [{ fixStyle: 'match-type' }],
      errors: [
        { messageId: 'no-ambiguous-vue-default-props' },
      ],
      output: `
        <script setup>
        withDefaults(defineProps({
          foo: Object,
        }), {
          foo: () => ({}),
        })
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo = (() => {}) as never } = defineProps<{
          foo?: Record<string, string>
        }>()
        </script>
      `,
      errors: [
        { messageId: 'no-ambiguous-vue-default-props' },
      ],
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo = (() => {}) as never } = defineProps<{
          foo?: Record<string, string>
        }>()
        </script>
      `,
      options: [{ fixStyle: 'remove' }],
      errors: [
        { messageId: 'no-ambiguous-vue-default-props' },
      ],
      output: `
        <script lang="ts" setup>
        const { foo } = defineProps<{
          foo?: Record<string, string>
        }>()
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo = (() => {}) as never } = defineProps<{
          foo?: Record<string, string>
        }>()
        </script>
      `,
      options: [{ fixStyle: 'match-type' }],
      errors: [
        { messageId: 'no-ambiguous-vue-default-props' },
      ],
      output: `
        <script lang="ts" setup>
        const { foo = (() => ({})) as never } = defineProps<{
          foo?: Record<string, string>
        }>()
        </script>
      `,
    },
  ],
})
