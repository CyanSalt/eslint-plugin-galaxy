# Disallow unused properties from Vuex (`no-unused-vuex-properties`)

The rule [`vue/no-unused-properties`](https://eslint.vuejs.org/rules/no-unused-properties.html) will not check properties from [Vuex](https://vuex.vuejs.org/). Sometimes you may leave some unused Vuex properties behind, which can cause you to make bad judgments when you're ready to delete them.

## Fail

```js
export default {
  computed: {
    ...mapState(['foo']),
  },
}
```

```js
export default {
  computed: {
    ...mapGetters('bar', { myBaz: 'baz' }),
  },
}
```

```js
export default {
  methods: {
    ...mapActions(['qux']),
  },
}
```

## Pass

```vue
<template>
  <p>{{ foo }}</p>
</template>

<script>
export default {
  computed: {
    ...mapState(['foo']),
  },
}
</script>
```

```js
export default {
  created() {
    this.bar()
  },
  methods: {
    ...mapActions(['bar']),
  },
}
```
