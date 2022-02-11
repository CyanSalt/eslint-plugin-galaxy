# eslint-plugin-galaxy

Various ESLint rules in one plugin.

## Installation

```shell
npm install --save-dev eslint-plugin-galaxy
```

## Usage

```js
// .eslintrc.js
module.exports = {
  extends: {
    'plugin:galaxy/recommended',
    // for Vue
    'plugin:galaxy/recommended-vue',
  }
}
```

## Rules

- [`import-extensions`](./docs/rules/import-extensions.md) - Ensure consistent use of file extension within the import path 🔧

- [`max-nested-destructuring`](./docs/rules/max-nested-destructuring.md) - Enforce a maximum depth that destructuring can be nested

- [`multi-branch-curly`](./docs/rules/multi-branch-curly.md) - Require following curly brace conventions for statements with multiple branches 🔧

- [`no-for-in`](./docs/rules/no-for-in.md) - Disallow for-in statements

- [`no-unsafe-window-open`](./docs/rules/no-unsafe-window-open.md) - Disallow unsafe `window.open()` ✅ 🔧

- [`non-control-statement-curly`](./docs/rules/non-control-statement-curly.md) - Require following curly brace conventions for non-control statements 🔧

- [`valid-indexof-return`](./docs/rules/valid-indexof-return.md) - Disallow boolean cast of returning value of `.indexOf()` ✅

### For Vue

- [`no-empty-vue-options`](./docs/vue/no-empty-vue-options.md) - Disallow using empty functions or objects as option values in Vue components ✅

- [`no-invalid-vue-inject-keys`](./docs/vue/no-invalid-vue-inject-keys.md) - Require valid keys in Vue `inject` options ✅

- [`no-invalid-vue-prop-keys`](./docs/vue/no-invalid-vue-prop-keys.md) - Require valid keys in Vue `props` options ✅

- [`no-shared-vue-provide`](./docs/vue/no-shared-vue-provide.md) - Enforce the `provide` option of Vue component to be a function ✅ 🔧

- [`no-unknown-vue-options`](./docs/vue/no-empty-vue-options.md) - Disallow unknown options in Vue components ✅

- [`no-unused-vuex-properties`](./docs/vue/no-unused-vuex-properties.md) - Disallow unused properties from Vuex ✅

- [`valid-vue-v-if-with-v-slot`](./docs/vue/valid-vue-v-if-with-v-slot.md) - Enforce valid `v-if` directives when using with `v-slot` ✅

- [`vue-attribute-spacing`](./docs/vue/vue-attribute-spacing.md) - Enforce unified spacing around binding attributes 🔧

*✅ means that the rule is contained in `plugin:galaxy/recommended` or `plugin:galaxy/recommended-vue`*.

*🔧 means that the rule could be fixed automatically*.
