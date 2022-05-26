# Enforce properties in Vue component options to be sorted in conventional order (`conventional-vue-keys-order`)

This rule may be another practice for [`vue/sort-keys`](https://eslint.vuejs.org/rules/sort-keys.html). In most cases, we may have a conventional order for certain options, such as placing `...mapState(['foo'])` before the properties declared within the component.

This rule has a set of built-in subrules. You can include with the given names, or declare your own rules with the specified option format.

This rule is fixable.

## Options

This rule has an object option:

- `"rules"` declares the name of the rules to be included. It should be an array of strings which could be any of the following:

  - `"model"`
  - `"props"`
  - `"props-properties"`
  - `"inject-properties"`
  - `"emits"`
  - `"data-return"`
  - `"computed"`
  - `"computed-strict"`
  - `"watch-properties"`
  - `"methods"`
  - `"methods-strict"`

- `"additionalRules"` declares the custom rules. It should be an array of objects with the following format:
  - `key`: The property name of the option to check. For example `"props"`.
  - `type`: The position that the rule used for. It can be:
    - `"default"`: If this property is an object, this object will be checked. This is the default.
    - `"properties"`: If the property values of this property are objects, these values will be checked. For example `props`.
    - `"return"`: If this property is a function and the function returns an object, the returned object will be checked. For example `data`.
  - `order`: The order of the properties of the object being checked. Each element can be:
    - A string corresponding to the property name. It can also be `"*"` used to match properties that do not match any other rules.
    - An object with the `selector` property. The `selector` is an [AST Selector](https://eslint.org/docs/developer-guide/selectors) expected to match properties.
    - An object with the `pattern` property. The `pattern` is a regular expression expected to match property names.

## Fail

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["model"] }] */
export default {
  model: {
    event: 'input',
    prop: 'value',
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["props"] }] */
export default {
  props: {
    bar: {
      type: String,
      default: '',
    },
    foo: {
      type: String,
      required: true,
    },
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["props-properties"] }] */
export default {
  props: {
    foo: {
      required: true,
      type: String,
    },
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["inject-properties"] }] */
export default {
  inject: {
    foo: {
      default: '',
      from: 'bar',
    },
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["emits"] }] */
export default {
  emits: {
    foo: () => true,
    'update:foo': () => true,
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["data-return"] }] */
export default {
  data() {
    return {
      baz: 1,
      FooBar,
    };
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["computed"] }] */
export default {
  computed: {
    bar() {
      return true;
    },
    ...mapState(['foo']),
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["computed-strict"] }] */
export default {
  computed: {
    ...mapGetters(['bar']),
    ...mapState(['foo']),
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["watch-properties"] }] */
export default {
  watch: {
    foo: {
      deep: true,
      handler(value) {
        this.bar = value
      },
    },
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["methods"] }] */
export default {
  methods: {
    bar() {
      return true;
    },
    ...mapActions(['foo']),
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["methods-strict"] }] */
export default {
  methods: {
    ...mapActions(['bar']),
    ...mapMutations(['foo']),
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "additionalRules": [{ "key": "foo", "order": ["bar", "baz"] }] }] */
export default {
  foo: {
    baz: 2,
    bar: 1,
  },
};
```

## Pass

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["model"] }] */
export default {
  model: {
    prop: 'value',
    event: 'input',
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["props"] }] */
export default {
  props: {
    foo: {
      type: String,
      required: true,
    },
    bar: {
      type: String,
      default: '',
    },
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["props-properties"] }] */
export default {
  props: {
    foo: {
      type: String,
      required: true,
    },
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["inject-properties"] }] */
export default {
  inject: {
    foo: {
      from: 'bar',
      default: '',
    },
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["emits"] }] */
export default {
  emits: {
    'update:foo': () => true,
    foo: () => true,
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["data-return"] }] */
export default {
  data() {
    return {
      FooBar,
      baz: 1,
    };
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["computed"] }] */
export default {
  computed: {
    ...mapState(['foo']),
    bar() {
      return true;
    },
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["computed-strict"] }] */
export default {
  computed: {
    ...mapState(['foo']),
    ...mapGetters(['bar']),
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["watch-properties"] }] */
export default {
  watch: {
    foo: {
      handler(value) {
        this.bar = value
      },
      deep: true,
    },
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["methods"] }] */
export default {
  methods: {
    ...mapActions(['foo']),
    bar() {
      return true;
    },
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "rules": ["methods-strict"] }] */
export default {
  methods: {
    ...mapMutations(['foo']),
    ...mapActions(['bar']),
  },
};
```

```js
/* eslint galaxy/conventional-vue-keys-order: ["error", { "additionalRules": [{ "key": "foo", "order": ["bar", "baz"] }] }] */
export default {
  foo: {
    bar: 1,
    baz: 2,
  },
};
```
