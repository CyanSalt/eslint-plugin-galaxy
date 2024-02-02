# Disallow duplicate store mapping functions in Vue components (`no-duplicate-vue-store-mappings`)

It is possible to map properties or methods multiple times from the same module of state management in Vue components. However, this may reduce the readability of the code.

This rule will merge mappings automatically which are able to be merged, for example, with the same namespace and the same parameter format. For Pinia, this rule can also help migrate deprecated `mapGetters` to `mapState` just with fully replacement and autofix.

This rule is fixable.

## Fail

```js
export default {
  computed: {
    ...mapState(['foo']),
    ...mapState(['bar']),
  },
}
```

```js
export default {
  methods: {
    ...mapActions(useFoo, {
      foo: 'bar'
    }),
    ...mapActions(useFoo, {
      bar: 'baz',
    }),
  },
}
```

## Pass

```js
export default {
  computed: {
    ...mapState(['foo']),
    ...mapState('bar', ['baz']),
  },
}
```

```js
export default {
  methods: {
    ...mapActions('foo', { bar: 'baz' }),
    ...mapActions('foo', ['qux']),
  },
}
```
