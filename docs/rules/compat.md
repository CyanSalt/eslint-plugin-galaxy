# Avoid using incompatible features (`compat`)

Although tools such as Babel or SWC can transform and polyfill modern JS features automatically, there are still some syntax and DOM APIs that cannot actually be converted, such as the Asynchronous Clipboard API, JS regular expression lookbehind, etc. Using these features may not reveal the problem in the development environment, but it will affect the availability of the production environment.

[`eslint-plugin-compat`](https://github.com/amilajack/eslint-plugin-compat) could check some features, but some newer features are not supported.

This rule can automatically obtain the browserslist configuration in the project and check compatibility for the target browsers. It supports a small number of modern features and can be used with `eslint-plugin-compat` as needed.

## Options

This rule has an object option:

- `"browserslist"` specify compatibility targets explicitly
- `"ignores"` specify ignored features. Each element of the array is a feature identifier in [`caniuse-lite/data/features`](https://github.com/browserslist/caniuse-lite/tree/main/data/features)

## Fail

```js
/* eslint galaxy/compat: ["error", { "browserslist": "chrome 61" }] */
const regexp = /(?<=abc)/
```

```js
/* eslint galaxy/compat: ["error", { "browserslist": "firefox 62" }] */
navigator.clipboard.write(data)
```

## Pass

```js
/* eslint galaxy/compat: ["error", { "browserslist": "chrome 61" }] */
const regexp = /(?=abc)/
```

```js
/* eslint galaxy/compat: ["error", { "browserslist": "chrome 62" }] */
const regexp = /(?<=abc)/
```

```js
/* eslint galaxy/compat: ["error", { "browserslist": "firefox 62" }] */
navigator.geolocation.getCurrentPosition(callback)
```

```js
/* eslint galaxy/compat: ["error", { "browserslist": "firefox 63" }] */
navigator.clipboard.write(data)
```
