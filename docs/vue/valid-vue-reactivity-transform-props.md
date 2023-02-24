# Enforce Vue props with Reactivity Transform to be valid (`valid-vue-reactivity-transform-props`)

Reactivity Transform provides considerable convenience for the declaration of props. However, these usages may not be properly recognized by `eslint-plugin-vue`, e.g. rules like [`vue/require-valid-default-prop`](https://eslint.vuejs.org/rules/require-valid-default-prop.html), [`vue/no-required-prop-with-default`](https://eslint.vuejs.org/rules/no-required-prop-with-default.html), etc.

In addition, [`@vue-macros/reactivity-transform`](http://npmjs.com/package/@vue-macros/reactivity-transform)'s handling of defaults is incompatible with TS and requires special type assertions to enable it to generate correct runtime checked code.

This rule is fixable.

## Fail

```vue
<script lang="ts" setup>
const { foo } = $(defineProps<{
  foo: string
}>())
</script>
```

```vue
<script lang="ts" setup>
const { foo } = $(withDefaults(defineProps<{
  foo?: string
}>(), {
  foo: '',
}))
</script>
```

```vue
<script lang="ts" setup>
const { foo = '' } = defineProps<{
  foo: string
}>()
</script>
```

```vue
<script lang="ts" setup>
const { foo = [] } = defineProps<{
  foo?: string[]
}>()
</script>
```

```vue
<script lang="ts" setup>
const { foo = () => [] } = defineProps<{
  foo?: string[]
}>()
</script>
```

## Pass

```vue
<script lang="ts" setup>
const { foo } = defineProps<{
  foo: string
}>()
</script>
```

```vue
<script lang="ts" setup>
const { foo = '' } = defineProps<{
  foo?: string
}>()
</script>
```

```vue
<script lang="ts" setup>
const { foo = (() => ({})) as never } = defineProps<{
  foo?: object
}>()
</script>
```

```vue
<script lang="ts" setup>
const { foo = () => {} } = defineProps<{
  foo?: () => void,
}>()
</script>
```

```vue
<script setup>
const { foo = () => ({}) } = defineProps({
  foo: Object,
})
</script>
```
