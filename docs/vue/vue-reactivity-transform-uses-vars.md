# Prevent variables used in reactivity transform to be marked as unused (`vue-reactivity-transform-uses-vars`)

Reactivity Transform can transform Vue `Ref`s into variables, and reads and writes to these variables correspond to reads and writes to the `value`s of them, which means that writes to these variables have side effects. However, ESLint does not recognize this case, so the following code will trigger the `no-unused-vars` rule to report:

```vue
<script setup>
let foo = $(useFoo())
onMounted(() => {
  foo = 1
})
</script>
```

This rule will find such variables and mark them as used.

## Fail

```vue
<script setup>
let foo = $(useFoo())
</script>
```

```vue
<script>
let foo = $(useFoo())
onMounted(() => {
  foo = 1
})
</script>
```

## Pass

```vue
<script setup>
let foo = $(useFoo())
onMounted(() => {
  foo = 1
})
</script>
```

```vue
<script setup>
/* global $ */
let foo = $(useFoo())
onMounted(() => {
  foo = 1
})
</script>
```

```vue
<script setup>
import { $ } from 'vue/macros'
let foo = $(useFoo())
onMounted(() => {
  foo = 1
})
</script>
```

```vue
<script setup>
let { foo } = $(useFoo())
onMounted(() => {
  foo = 1
})
</script>
```
