# Enforce ES Module bundler APIs instead of Node APIs (`esm-bundler`)

Webpack supports Node APIs for features such as module systems, compile-time constants, etc., but most other bundlers do not support these APIs. For example:

- `process.env` in webpack, and `import.meta.env` in Vite
- `module.exports` in webpack, and `export` in esbuild
- `require.context` in webpack, and `import.meta.glob` in Vite

Instead, webpack can be configured or plugged to support more modern ES Module APIs.

This rule completes the following rules:

- `no-process-env`: It is deprecated
- `import/no-commonjs`: It cannot detect cases such as `require.resolve`

## Options

This rule has an object option:

- `"allowProcessEnv"` (default `false`) allows `process.env`
- `"allowCommonJs"` (default `false`) allows `module.exports` or `exports.*`
- `"allowRequire"` (default `false`) allows `require`

## Fail

```js
const version = process.env.VERSION
```

```js
module.exports = foo
```

```js
const { foo } = require('foo')
foo.source = require.resolve('bar')
```

## Pass

```js
const version = import.meta.env.VERSION
```

```js
export default foo
```

```js
import { foo } from 'foo'
```

```js
/* eslint galaxy/esm-bundler: ["error", { "allowProcessEnv": true }] */
const version = process.env.VERSION
```
