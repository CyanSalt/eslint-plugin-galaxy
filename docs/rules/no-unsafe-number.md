# Disallow optional chain in numerical calculation (`no-unsafe-number`)

Optional chaining is often easily abused, typically in numerical calculations, where it may result in `NaN`s, which may affect the correctness of the application content.

This rule is quite strict and almost means that `NaN` no longer belongs to the number type. Make sure to enable this rule only when you do not expect `NaN` to appear at all.

## Fail

```js
const value = Number(foo?.bar)
```

```js
const value = foo?.bar - 1
```

```js
const value = Math.floor(foo?.bar)
```

```js
const value = foo?.bar + Number.parseInt(qux)
```

```vue
<template>
  <Foo :value="Number(foo?.bar)" />
</template>
```

## Pass

```js
const value = foo?.bar + baz
```

```js
const value = Number(foo?.bar ?? 0)
```

```js
if (Number(foo?.bar)) {}
```

```vue
<template>
  <Foo v-if="Number(foo?.bar)" />
</template>
```
