# eslint-plugin-galaxy

[![npm](https://img.shields.io/npm/v/eslint-plugin-galaxy.svg)](https://www.npmjs.com/package/eslint-plugin-galaxy)

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

- [`esm-bundler`](./docs/rules/esm-bundler.md) - Enforce ES Module bundler APIs instead of Node APIs

- [`import-extensions`](./docs/rules/import-extensions.md) - Ensure consistent use of file extension within the import path 🔧

- [`max-nested-destructuring`](./docs/rules/max-nested-destructuring.md) - Enforce a maximum depth that destructuring can be nested

- [`multi-branch-curly`](./docs/rules/multi-branch-curly.md) - Require following curly brace conventions for statements with multiple branches 🔧

- [`no-for-in`](./docs/rules/no-for-in.md) - Disallow for-in statements

- [`no-misused-globals`](./docs/rules/no-misused-globals.md) - Disallow global variables that may be misused

- [`no-prototype-as-value`](./docs/rules/no-prototype-as-value.md) - Disallow using prototype of functions as values ✅

- [`no-restricted-barrel-imports`](./docs/rules/no-restricted-barrel-imports.md) - Disallow specified barrel modules when loaded by `import` 🔧

- [`no-restricted-floating-promises`](./docs/rules/no-restricted-floating-promises.md) - Enforce Promises with specified syntax to be handled appropriately

- [`no-unnecessary-optional-chain`](./docs/rules/no-unnecessary-optional-chain.md) - Disallow unnecessary optional chain ✅ 🔧

- [`no-unsafe-window-open`](./docs/rules/no-unsafe-window-open.md) - Disallow unsafe `window.open()` ✅ 🔧

- [`non-control-statement-curly`](./docs/rules/non-control-statement-curly.md) - Require following curly brace conventions for non-control statements 🔧

- [`valid-indexof-return`](./docs/rules/valid-indexof-return.md) - Disallow boolean cast of returning value of `.indexOf()` ✅

### For TypeScript

- [`no-as-any`](./docs/typescript/no-as-any.md) - Disallow `any` type assertions

### For Vue

- [`conventional-vue-keys-order`](./docs/vue/conventional-vue-keys-order.md) - Enforce properties in Vue component options to be sorted in conventional order 🔧

- [`no-ambiguous-vue-default-props`](./docs/vue/no-ambiguous-vue-default-props.md) - Disallow using empty functions as default values of Vue props 🔧

- [`no-deprecated-vue-deep-combinator`](./docs/vue/no-deprecated-vue-deep-combinator.md) - Disallow using deprecated Vue `::v-deep` combinators 🔧

- [`no-duplicate-vuex-properties`]() - Disallow duplicate properties from Vuex ✅

- [`no-empty-vue-options`](./docs/vue/no-empty-vue-options.md) - Disallow using empty functions or objects as option values in Vue components ✅

- [`no-invalid-vue-inject-keys`](./docs/vue/no-invalid-vue-inject-keys.md) - Require valid keys in Vue `inject` options ✅

- [`no-invalid-vue-prop-keys`](./docs/vue/no-invalid-vue-prop-keys.md) - Require valid keys in Vue `props` options ✅

- [`no-restricted-vue-unhandled-promises`](./docs/vue/no-restricted-vue-unhandled-promises.md) - Enforce Promises in Vue functions with specified syntax to be handled appropriately

- [`no-shared-vue-provide`](./docs/vue/no-shared-vue-provide.md) - Enforce the `provide` option of Vue component to be a function ✅ 🔧

- [`no-unknown-vue-options`](./docs/vue/no-empty-vue-options.md) - Disallow unknown options in Vue components ✅

- [`no-unused-vuex-properties`](./docs/vue/no-unused-vuex-properties.md) - Disallow unused properties from Vuex ✅

- [`require-vue-default-inject`](./docs/vue/require-vue-default-inject.md) - Require default value for inject ✅ 🔧

- [`valid-vue-reactivity-transform-props`](./docs/vue/valid-vue-reactivity-transform-props.md) - Enforce Vue props with Reactivity Transform to be valid 🔧

- [`valid-vue-v-if-with-v-slot`](./docs/vue/valid-vue-v-if-with-v-slot.md) - Enforce valid `v-if` directives when using with `v-slot` ✅

- [`valid-vuex-properties`](./docs/vue/valid-vuex-properties.md) - Enforce valid property mappings with Vuex ✅

- [`vue-attribute-spacing`](./docs/vue/vue-attribute-spacing.md) - Enforce unified spacing around binding attributes 🔧

- [`vue-reactivity-transform-uses-vars`](./docs/vue/vue-reactivity-transform-uses-vars.md) - Prevent variables used in reactivity transform to be marked as unused

*✅ means that the rule is contained in `plugin:galaxy/recommended` or `plugin:galaxy/recommended-vue`*.

*🔧 means that the rule could be fixed automatically*.
