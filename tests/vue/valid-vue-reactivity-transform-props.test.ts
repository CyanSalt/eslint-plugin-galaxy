/**
 * @vitest-environment node
 */
import rule from '../../src/vue/valid-vue-reactivity-transform-props'
import { vueRuleTester } from '../tester'

vueRuleTester.run('valid-vue-reactivity-transform-props', rule, {
  valid: [
    {
      code: `
        <script lang="ts" setup>
        const props = defineProps<{
          foo: string,
        }>()
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo } = defineProps<{
          foo: string,
        }>()
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo = '' } = defineProps<{
          foo?: string,
        }>()
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo = {} } = defineProps<{
          foo?: object,
        }>()
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo = (() => ({})) as never } = defineProps<{
          foo?: object,
        }>()
        </script>
      `,
      options: [{ functionsAsObjectDefaults: true }],
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo = () => {} } = defineProps<{
          foo?: () => void,
        }>()
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo = () => {} } = defineProps<{
          foo?: () => void,
        }>()
        </script>
      `,
      options: [{ functionsAsObjectDefaults: true }],
    },
    {
      code: `
        <script setup>
        const { foo = () => ({}) } = defineProps({
          foo: Object,
        })
        </script>
      `,
      options: [{ functionsAsObjectDefaults: true }],
    },
  ],
  invalid: [
    {
      code: `
        <script lang="ts" setup>
        const { foo } = $(defineProps<{
          foo: string,
        }>())
        </script>
      `,
      errors: [
        {
          messageId: 'valid-vue-reactivity-transform-props.transform',
          data: { name: 'defineProps' },
        },
      ],
      output: `
        <script lang="ts" setup>
        const { foo } = defineProps<{
          foo: string,
        }>()
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo } = $(withDefaults(defineProps<{
          foo?: string,
        }>(), {
          foo: '',
        }))
        </script>
      `,
      errors: [
        {
          messageId: 'valid-vue-reactivity-transform-props.transform',
          data: { name: 'withDefaults' },
        },
      ],
      output: `
        <script lang="ts" setup>
        const { foo = '' } = defineProps<{
          foo?: string,
        }>()
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo } = $(withDefaults(defineProps<{
          foo?: string,
          bar?: number,
        }>(), {
          foo: '',
          bar: 1,
        }))
        </script>
      `,
      errors: [
        {
          messageId: 'valid-vue-reactivity-transform-props.transform',
          data: { name: 'withDefaults' },
        },
      ],
      output: `
        <script lang="ts" setup>
        const { foo = ''/* , bar = 1 */ } = defineProps<{
          foo?: string,
          bar?: number,
        }>()
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo = '' } = defineProps<{
          foo: string,
        }>()
        </script>
      `,
      errors: [
        {
          messageId: 'valid-vue-reactivity-transform-props.optional',
          data: { name: 'foo' },
        },
      ],
      output: `
        <script lang="ts" setup>
        const { foo = '' } = defineProps<{
          foo?: string,
        }>()
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo = () => [] } = defineProps<{
          foo?: string[],
        }>()
        </script>
      `,
      errors: [
        {
          messageId: 'valid-vue-reactivity-transform-props.no-functions-as-object-defaults',
          data: { name: 'foo' },
        },
      ],
      output: `
        <script lang="ts" setup>
        const { foo = [] } = defineProps<{
          foo?: string[],
        }>()
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo = [] } = defineProps<{
          foo?: string[],
        }>()
        </script>
      `,
      errors: [
        {
          messageId: 'valid-vue-reactivity-transform-props.functions-as-object-defaults',
          data: { name: 'foo' },
        },
      ],
      output: `
        <script lang="ts" setup>
        const { foo = () => [] } = defineProps<{
          foo?: string[],
        }>()
        </script>
      `,
      options: [{ functionsAsObjectDefaults: true }],
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo = () => ({}) } = defineProps<{
          foo?: Record<string, string>,
        }>()
        </script>
      `,
      errors: [
        {
          messageId: 'valid-vue-reactivity-transform-props.no-functions-as-object-defaults',
          data: { name: 'foo' },
        },
      ],
      output: `
        <script lang="ts" setup>
        const { foo = {} } = defineProps<{
          foo?: Record<string, string>,
        }>()
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo = {} } = defineProps<{
          foo?: Record<string, string>,
        }>()
        </script>
      `,
      errors: [
        {
          messageId: 'valid-vue-reactivity-transform-props.functions-as-object-defaults',
          data: { name: 'foo' },
        },
      ],
      output: `
        <script lang="ts" setup>
        const { foo = () => ({}) } = defineProps<{
          foo?: Record<string, string>,
        }>()
        </script>
      `,
      options: [{ functionsAsObjectDefaults: true }],
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo = (() => []) as never } = defineProps<{
          foo?: string[],
        }>()
        </script>
      `,
      errors: [
        {
          messageId: 'valid-vue-reactivity-transform-props.no-functions-as-object-defaults',
        },
      ],
      output: `
        <script lang="ts" setup>
        const { foo = [] } = defineProps<{
          foo?: string[],
        }>()
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        const { foo = () => [] } = defineProps<{
          foo?: string[],
        }>()
        </script>
      `,
      errors: [
        {
          messageId: 'valid-vue-reactivity-transform-props.defaults-type',
        },
      ],
      output: `
        <script lang="ts" setup>
        const { foo = (() => []) as never } = defineProps<{
          foo?: string[],
        }>()
        </script>
      `,
      options: [{ functionsAsObjectDefaults: true }],
    },
  ],
})
