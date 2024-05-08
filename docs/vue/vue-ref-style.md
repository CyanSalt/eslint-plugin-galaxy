# Enforce Vue refs style (`vue-ref-style`)

Vue uses refs and their `value` property to manage reactive values macros derived from the Reactivity Transform proposal has also become an option at the same time for ergonomic considerations. However, mixing the two can cause maintenance headaches.

This rule is used to restrict **variable initialization** using different styles of refs. Code such as `inject(MySymbol, ref())` will be ignored.

## Options

This rule has a string option:

- `"ref"` requires that reactive values must be created using factory functions from Vue.
- `"macro"` requires that reactive variables must be created using macros.
- `"consistent"` (default) requires that reactive values be created in the same way, whether as factory functions or macros.

## Fail

```vue
<script setup>
import { ref } from 'vue'

let foo = ref()
let bar = $ref()
</script>
```

```vue
<script setup>
/* eslint galaxy/vue-ref-style: ["error", "ref"] */
let foo = $ref()
</script>
```

```vue
<script setup>
/* eslint galaxy/vue-ref-style: ["error", "macro"] */
import { ref } from 'vue'

let foo = ref()
</script>
```

## Pass

```vue
<script setup>
import { ref } from 'vue'

let foo = ref()
</script>
```

```vue
<script setup>
let foo = $ref()
</script>
```

```

```vue
<script setup>
/* eslint galaxy/vue-ref-style: ["error", "ref"] */
import { ref } from 'vue'

let foo = ref()
</script>
```

```vue
<script setup>
/* eslint galaxy/vue-ref-style: ["error", "macro"] */
let foo = $ref()
</script>
```
