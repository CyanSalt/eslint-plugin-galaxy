# Require following curly brace conventions for non-return statements (`non-return-statement-curly`)

Omitting the curly braces in an IfStatement can make code clearer sometimes, such as "return early". However, in the case of non-return statements, this can easily lead to errors on subsequent modifications.

This rule may conflict with ESLint's `curly` in some cases, so you may need to turn off the `curly` rule.

This rule is fixable.

## Fail

```js
if (foo) bar()
```

## Pass

```js
if (foo) {
  bar()
}
```

```js
if (foo) return
```
