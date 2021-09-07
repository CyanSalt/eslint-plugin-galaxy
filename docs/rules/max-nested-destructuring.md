# Enforce a maximum depth that destructuring can be nested (`max-nested-destructuring`)

Variable declarations use destructuring in many cases. For some complex objects, nested destructuring may occur. The deeper the nesting, the less readable the code will be.

## Options

This rule has an object option:

- `"max"` (default `3`) enforces a maximum depth that destructuring can be nested

## Fail

```js
const { foo: { bar: [{ baz }] } } = qux
```

```js
/* eslint galaxy/max-nested-destructuring: ["error", { "max": 2 }]*/
const { foo: { bar: { baz } } } = qux
```

## Pass

```js
const { foo: { bar: { baz } } } = qux
```

```js
/* eslint galaxy/max-nested-destructuring: ["error", { "max": 2 }]*/
const { foo: { bar: baz } } = qux
```
