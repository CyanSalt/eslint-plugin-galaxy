# Disallow using empty functions as default values of Vue props (`no-ambiguous-vue-default-props`)

There is a special logic to Vue's support for props defaults: To avoid confusing defaults across multiple component instances, `default` needs to be declared as a function when the default value is an object type.

A common mistake is that `default` is declared as `() => {}` for the case where the default value is an empty object. In most cases we expect the behavior to be `() => ({})`, but the former is still legal, and the default value will be `undefined`.

This rule tries to identify where there is a similar ambiguity problem.

This rule is fixable (if needed).

## Options

This rule has an object option:

- `"fixStyle"` specifies how this rule fixes these problems:
  - `"remove"`: The rule will remove ambiguous statements in case of equivalence.
  - `"match-type"`: The rule will replaces the default value with a value matching `type`, e.g. `() => ({})`.
  - `"none"` (default): The rule will not fix problems automatically.

## Fail

```vue
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
```

```vue
<script setup>
withDefaults(defineProps({
  foo: Object,
}), {
  foo: () => {},
})
</script>
```

```vue
<script lang="ts" setup>
const { foo = (() => {}) as never } = defineProps<{
  foo?: Record<string, string>
}>()
</script>
```

## Pass

```vue
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
```

```vue
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
```

```vue
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
```

```vue
<script setup>
withDefaults(defineProps({
  foo: Function,
}), {
  foo: () => {},
})
</script>
```

```vue
<script setup>
const { foo = () => {} } = defineProps({
  foo: [Function],
})
</script>
```

```vue
<script lang="ts" setup>
withDefaults(defineProps<{
  foo?: () => void
}>(), {
  foo: () => {},
})
</script>
```

```vue
<script lang="ts" setup>
const { foo = () => {} } = defineProps<{
  foo?: any
}>()
</script>
```
