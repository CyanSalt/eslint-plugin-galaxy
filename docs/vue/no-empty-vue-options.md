# Disallow using empty functions or objects as option values in Vue SFC (`no-empty-vue-options`)

Empty options, much like unused variables, are often a result of incomplete refactoring and may confuse readers.

This rule will not check empty functions and objects with comments. You can leave empty options with any comments inside to avoid emitting lint errors.

## Fail

```js
export default {
  methods: {},
}
```

```js
export default {
  created() {},
}
```

```js
export default {
  created: () => {},
}
```

## Pass

```js
export default {
  components: {
    Popover,
  },
}
```

```js
export default {
  components: {
    // pass
  },
}
```

```js
export default {
  created() {
    // pass
  },
}
```

```js
/* eslint galaxy/no-empty-vue-options: ["error", { "ignores": ["methods"] }]*/
export default {
  methods: {},
}
```
