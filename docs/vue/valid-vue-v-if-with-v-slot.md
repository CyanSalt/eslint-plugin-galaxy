# Enforce valid `v-if` directives when using with `v-slot` (`valid-vue-v-if-with-v-slot`)

The `v-slot` directive has been added since Vue 2.6, providing the same semantics as the deprecated `slot-scope`. However, there is a slight difference between them: when you use both `v-if` and `v-slot` on the same node, `v-if` could not get props passed by the slot, which is inconsistent with `slot-scope`.

When using Vue 2.6 onwards, you may use the [`vue/no-deprecated-slot-scope-attribute`](https://eslint.vuejs.org/rules/no-deprecated-slot-scope-attribute.html) rule to replace `slot-scope` with `v-slot` automatically. It is worth noting that the Vue team is also aware of the problem described above, so the rule will not automatically fix it for this case, see [here](https://github.com/vuejs/eslint-plugin-vue/blob/master/lib/rules/syntaxes/utils/can-convert-to-v-slot.js).

To avoid relying on this behavior, this rule will disable the use of slot props in `v-if`, whether they come from `slot-scope` or `v-slot`.

## Fail

```vue
<template>
  <Foo>
    <template v-if="bar" #default="bar"></template>
  </Foo>
</template>
```

```vue
<template>
  <Foo>
    <template v-if="bar" #default="{ bar }"></template>
  </Foo>
</template>
```

## Pass

```vue
<template>
  <Foo>
    <template v-if="abc" #bar></template>
  </Foo>
</template>
```

```vue
<template>
  <Foo
    v-if="abc"
    v-slot="bar"
  />
</template>
```

```vue
<template>
  <Foo>
    <template v-if="abc" #default="bar"></template>
  </Foo>
</template>
```
