# Disallow unnecessary optional chain (`no-unnecessary-optional-chain`)

Optional chaining is a syntax prone to abuse. Using optional chains for non nullable expressions will generate extra compatibility code after transpiling, but also affects the readability of the code.

This rule is partly fixable.

## Fail

```js
[foo]?.bar
```

```js
new Foo()?.bar
```

```js
if (foo?.bar) { bar = foo?.bar }
```

```js
foo.bar ? foo.bar?.() : foo.baz
```

```js
foo?.[qux] && baz(foo?.[qux])
```

```js
foo.bar.baz > foo.bar?.qux
```

```js
foo.bar?.baz > foo.bar.qux
```

## Pass


```js
foo?.bar
```

```js
if (foo?.bar) { bar = foo.bar }
```

```js
foo.bar ? foo.bar() : foo.baz
```

```js
foo?.[qux] && baz(foo[qux])
```

```js
foo.bar?.baz > foo.bar?.qux
```
