# Disallow duplicate properties from Vuex (`no-duplicate-vuex-properties`)

Vuex supports expanding specific functions and declaring properties for components via strings or object literals. However, it is possible for these properties to duplicate object properties at the expanded location, or to duplicate each other. This usually produces unintended results.

## Fail

```js
export default {
  computed: {
    ...mapState(['foo']),
    foo() {
      return this.bar
    },
  },
}
```

```js
export default {
  computed: {
    ...mapState(['foo']),
    ...mapState('bar', ['foo', 'baz']),
  },
}
```

## Pass

```js
export default {
  computed: {
    ...mapState(['foo']),
    bar() {
      return this.baz
    },
  },
}
```
