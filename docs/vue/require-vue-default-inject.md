# Require default value for `inject` (`require-vue-default-inject`)

This rule requires default value to be set for each injections. For injections that lack a default value (does not satisfy `'default' in` or `arguments.length < 2` for Composition API), vue may output an error message in development mode.

This rule is partially fixable (when other means of specifying default values are used).

## Fail

```js
export default {
  inject: ['foo'],
}
```

```js
export default {
  inject: {
    foo: {
      from: 'bar',
    },
  },
}
```

```js
const foo = inject('foo')
```

```js
const foo = inject('foo') ?? bar()
```

## Pass

```js
export default {
  inject: {
    foo: {
      default: undefined,
    },
  },
}
```

```js
export default {
  inject: {
    foo: {
      default: () => [],
    },
  },
}
```

```js
const foo = inject('foo', false)
```

```js
const foo = inject('foo', () => [])
```
