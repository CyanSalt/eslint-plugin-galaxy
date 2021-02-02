# Disallow unknown options in Vue SFC

Unknown options are often a result of misspelling. For example, `beforeDestroyed` ought to be `beforeDestroy`.

This rule also supports several community packages such as `vuex`, `vue-router`, `nuxt`, etc.

## Fail

```js
export default {
  foo: {},
};
```

## Pass

```js
export default {
  components: {},
};
```

```js
export default {
  fetch() {},
};
```

```js
/* eslint galaxy/no-unknown-vue-options: ["error", { "allows": ["foo"] }]*/
export default {
  foo: {},
};
```
