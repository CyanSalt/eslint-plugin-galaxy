# Enforce the `provide` option of Vue component to be a function (`no-shared-vue-provide`)

When using the `provide` option on a Vue component, the same object will be shared by reference across all instances created. By declaring it as a function, the instances can be kept independent of each other.

This rule is fixable.

## Fail

```js
export default {
  provide: {
    foo: 'bar',
  },
}
```

## Pass

```js
export default {
  provide() {
    return {
      foo: 'bar',
    };
  },
}
```

```js
export default {
  provide: () => ({
    foo: 'bar',
  }),
}
```

```js
export default {
  provide: foo,
}
```
