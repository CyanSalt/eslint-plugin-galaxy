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

- [no-unsafe-window-open](./docs/rules/no-unsafe-window-open.md) - Disallow unsafe `window.open()` ✅ 🔧

### For Vue

- [no-empty-vue-options](./docs/rules/no-empty-vue-options.md) - Disallow using empty functions or objects as option values in Vue SFC ✅

- [no-unknown-vue-options](./docs/rules/no-empty-vue-options.md) - Disallow unknown options in Vue SFC ✅

*✅ means that the rule is contained in `plugin:galaxy/recommended` or `plugin:galaxy/recommended-vue`*.

*🔧 means that the rule could be fixed automatically*.
