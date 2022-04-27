# Enforce Promises with specified syntax to be handled appropriately (`no-restricted-floating-promises`)

A "floating" Promise is one that is created without any code set up to handle any errors it might throw.

Floating Promises can cause several issues, such as improperly sequenced operations, ignored Promise rejections, and more.

This rule is similar to [`@typescript-eslint/no-floating-promises`](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/no-floating-promises.md), except that it only checks Promise expressions with the specified syntax.

## Options

This rule has a list of string or object options. Each option can be:

- An [AST Selector](https://eslint.org/docs/developer-guide/selectors) string
- An object with the following properties:
  - `type`: Predefined selector, such as `vuex-action`, `element-message-box` or `vant-dialog`
  - `selector`: An [AST Selector](https://eslint.org/docs/developer-guide/selectors) string
  - `message`: Custom reporting message

## Fail

```js
/* eslint galaxy/no-restricted-floating-promises: ["error", "CallExpression[callee.name='foo']"] */
foo()
```

```js
/* eslint galaxy/no-restricted-floating-promises: ["error", "CallExpression[callee.name='foo']"] */
foo().then(() => {})
```

```js
/* eslint galaxy/no-restricted-floating-promises: ["error", { "type": "vuex-action" }] */
this.$store.dispatch('submit')
```

```js
/* eslint galaxy/no-restricted-floating-promises: ["error", { "type": "element-message-box" }] */
this.$confirm({})
```

```js
/* eslint galaxy/no-restricted-floating-promises: ["error", { "type": "vant-dialog" }] */
this.$dialog.confirm({})
```

## Pass

```js
/* eslint galaxy/no-restricted-floating-promises: ["error", "CallExpression[callee.name='foo']"] */
bar()
```

```js
/* eslint galaxy/no-restricted-floating-promises: ["error", "CallExpression[callee.name='foo']"] */
foo().catch(() => {})
```

```js
/* eslint galaxy/no-restricted-floating-promises: ["error", "CallExpression[callee.name='foo']"] */
foo().then(() => {}, () => {})
```

```js
/* eslint galaxy/no-restricted-floating-promises: ["error", "CallExpression[callee.name='foo']"] */
await foo()
```

```js
/* eslint galaxy/no-restricted-floating-promises: ["error", "CallExpression[callee.name='foo']"] */
Promise.all([foo()])
```