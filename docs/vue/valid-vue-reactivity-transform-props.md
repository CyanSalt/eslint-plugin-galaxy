# Enforce Vue props with Reactivity Transform to be valid (`valid-vue-reactivity-transform-props`)

Reactivity Transform provides considerable convenience for the declaration of props. However, these usages may not be properly recognized by `eslint-plugin-vue`, e.g. rules like [`vue/require-valid-default-prop`](https://eslint.vuejs.org/rules/require-valid-default-prop.html), [`vue/no-required-prop-with-default`](https://eslint.vuejs.org/rules/no-required-prop-with-default.html), etc.

In addition, [`@vue-macros/reactivity-transform`](http://npmjs.com/package/@vue-macros/reactivity-transform)'s handling of defaults is incompatible with TS and requires special type assertions to enable it to generate correct runtime checked code.

This rule is fixable.

## Options

This rule has an object option:

- `"functionsAsObjectDefaults"` (default `false`) enforces default values for array or object props to be wrapped with functions, which is consistent with the conventions of `@vue-macros/reactivity-transform@<1.1.3` (and compatible with new versions).

## Fail

```vue
<script lang="ts" setup>
const { foo } = $(defineProps<{
  foo: string,
}>())
</script>
```

```vue
<script lang="ts" setup>
const { foo } = $(withDefaults(defineProps<{
  foo?: string,
}>(), {
  foo: '',
}))
</script>
```

```vue
<script lang="ts" setup>
const { foo = '' } = defineProps<{
  foo: string,
}>()
</script>
```

```vue
<script lang="ts" setup>
const { foo = () => [] } = defineProps<{
  foo?: string[],
}>()
</script>
```

```vue
<!-- eslint galaxy/valid-vue-reactivity-transform-props: ["error", { "functionsAsObjectDefaults": true }] -->
<script lang="ts" setup>
const { foo = [] } = defineProps<{
  foo?: string[],
}>()
</script>
```

```vue
<!-- eslint galaxy/valid-vue-reactivity-transform-props: ["error", { "functionsAsObjectDefaults": true }] -->
<script lang="ts" setup>
const { foo = () => [] } = defineProps<{
  foo?: string[],
}>()
</script>
```

## Pass

```vue
<script lang="ts" setup>
const { foo } = defineProps<{
  foo: string,
}>()
</script>
```

```vue
<script lang="ts" setup>
const { foo = '' } = defineProps<{
  foo?: string,
}>()
</script>
```

```vue
<script setup>
const { foo = {} } = defineProps<{
  foo?: object,
}>()
</script>
```

```vue
<!-- eslint galaxy/valid-vue-reactivity-transform-props: ["error", { "functionsAsObjectDefaults": true }] -->
<script lang="ts" setup>
const { foo = (() => ({})) as never } = defineProps<{
  foo?: object,
}>()
</script>
```

```vue
<!-- eslint galaxy/valid-vue-reactivity-transform-props: ["error", { "functionsAsObjectDefaults": true }] -->
<script lang="ts" setup>
const { foo = () => {} } = defineProps<{
  foo?: () => void,
}>()
</script>
```

```vue
<!-- eslint galaxy/valid-vue-reactivity-transform-props: ["error", { "functionsAsObjectDefaults": true }] -->
<script setup>
const { foo = () => ({}) } = defineProps({
  foo: Object,
})
</script>
```
