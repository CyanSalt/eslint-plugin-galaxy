# Enforce a convention in the order of specified options in Vue SFC (`order-in-vue-options`)

Sometimes you may want to control the order of properties which are declared in certain component options. For example, when you are using the `import/order` rule, you might want the order of components to be the same as the order of imports.

## Fail

```js
/* eslint galaxy/order-in-vue-options: ["error", "components"]*/
export default {
  components: {
    Popover,
    Button,
  },
};
```

```js
/* eslint galaxy/order-in-vue-options: ["error", { "name": "foo", "order": ["b", "a"] }]*/
export default {
  foo: {
    a: 'a',
    b: 'b',
  },
};
```

## Pass

```js
/* eslint galaxy/order-in-vue-options: ["error", "components"]*/
export default {
  components: {
    Button,
    Popover,
  },
};
```

```js
/* eslint galaxy/order-in-vue-options: ["error", { "name": "components" }]*/
export default {
  components: {
    'my-button': Button,
    'my-popover': Popover,
  },
};
```

```js
/* eslint galaxy/order-in-vue-options: ["error", { "name": "foo", "order": ["b", "a"] }]*/
export default {
  foo: {
    b: 'b',
    c: 'c',
    a: 'a',
  },
};
```

```js
/* eslint galaxy/order-in-vue-options: ["error", { "name": "foo", "order": ["b", "a"] }]*/
export default {
  foo() { // won't be checked since it is not an object expression
    return {
      b: 'b',
      c: 'c',
      a: 'a',
    }
  },
};
```

```js
/* eslint galaxy/order-in-vue-options: ["error", "components"]*/
export default {
  components: {
    ...component, // spread elements will be skipped
    Button,
  },
};
```
