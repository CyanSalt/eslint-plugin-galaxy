# Disallow using prototype of functions as values (`no-prototype-as-value`)

The early `prototype` of a built-in functions in ECMAScript behaved like instances. However, this is a very rare feature in general and should be avoided at all costs.

In addition, some built-in methods support manual passing of `thisArgs`, in which case you can actually use prototype methods as values, but this will result in reduced readability and loss of some type information.

## Options

This rule has an object option:

- `"ignores"` ignores specified callees when used as function arguments

## Fail

```js
const noop = Function.prototype
```

```js
const proxy = new Proxy(Object.prototype, {})
```

```js
return foo.map(Number.prototype.toFixed, bar)
```

## Pass

```js
Object.prototype.toString.call(foo)
```

```js
Object.defineProperty(Array.prototype, foo, bar)
```

```js
if (foo in Array.prototype) {}
```

```js
/* eslint galaxy/no-prototype-as-value: ["error", { "ignores": ["expect"] }] */
expect(Object.create(null).prototype).toBe(null);
```
