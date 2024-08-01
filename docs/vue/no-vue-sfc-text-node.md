# Disallow text nodes in Vue SFC files (`no-vue-sfc-text-node`)

Vue SFC is compatible with HTML syntax. However, sometimes we may add code or text outside the element blocks mistakenly, which complies with HTML syntax but is usually not as expected. For example, we may add JS comments (instead of HTML comments) to the top level of the file.

This rule is partially fixable (when the text is a valid JavaScript comment).

## Fail

```vue
<script setup></script>
Foo
```

```vue
<script setup></script>
/* Foo */
```

## Pass

```vue
<script setup></script>
```

```vue
<script setup></script>
<!-- Foo -->
```
