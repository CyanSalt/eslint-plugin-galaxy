# Enforce valid property mappings with Vuex (`valid-vuex-properties`)

Vuex has provided powerful property mapping functions such as `mapState` and `mapGetters`. However, this can be very easily confused with the default computed properties when using functions to map properties.

This rule will report an error if `this` keyword is used in a property mapping function, or if the function does not reference any arguments.

## Fail

```js
export default {
  computed: {
    ...mapState({
      foo(state) {
        return this.bar + state.baz
      },
    }),
  },
}
```

```js
export default {
  computed: {
    ...mapGetters({
      foo(state) {
        return 'bar'
      },
    }),
  },
}
```

## Pass

```js
export default {
  computed: {
    ...mapState({
      foo: state => state.foo,
    }),
    bar() {
      return this.baz
    },
  },
}
```
