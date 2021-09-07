# Require valid keys in Vue props options (`no-invalid-vue-prop-keys`)

Invalid keys are often a result of misspelling. For example, `require` ought to be `required`.

## Fail

```js
export default {
  props: {
    foo: {
      type: Object,
      require: true,
    },
  },
}
```

```js
export default {
  props: {
    foo: {
      type: Object,
      validate(value) {
        return !value.disabled
      },
    },
  },
}
```

## Pass

```js
export default {
  props: {
    foo: {
      type: String,
      default: '',
    },
  },
}
```

```js
export default {
  props: {
    foo: {
      type: Object,
      required: true,
    },
  },
}
```

```js
export default {
  props: ['foo'],
}
```

```js
/* eslint galaxy/no-invalid-vue-prop-keys: ["error", { "allows": ["comment"] }]*/
export default {
  props: {
    foo: {
      type: Object,
      required: true,
      comment: 'Foo from parent',
    },
  },
}
```
