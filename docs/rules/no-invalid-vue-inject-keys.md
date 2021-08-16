# Require valid keys in Vue inject options (`no-invalid-vue-inject-keys`)

Invalid keys are often a result of misspelling. For example, `form` ought to be `from`.

## Fail

```js
export default {
  inject: {
    foo: {
      form: 'bar',
    },
  },
}
```

## Pass

```js
export default {
  inject: {
    foo: {
      from: 'bar',
      default: '',
    },
  },
}
```

```js
export default {
  inject: ['foo'],
}
```

```js
/* eslint galaxy/no-invalid-vue-inject-keys: ["error", { "allows": ["comment"] }]*/
export default {
  inject: {
    foo: {
      from: 'bar',
      default: '',
      comment: 'Foo from parent',
    },
  },
}
```
