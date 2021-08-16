# Require following curly brace conventions for statements with multiple branches (`multi-branch-curly`)

Omitting the curly braces in an IfStatement can make code clearer sometimes, such as "return early". However, in cases where multiple branches are used, this can easily lead to misunderstandings due to inconsistencies.

This rule may conflict with ESLint's `curly` in some cases, so you may need to turn off the `curly` rule.

This rule is fixable.

## Fail

```js
if (foo) bar()
else baz()
```

```js
function demo() {
  if (foo) {
    bar()
  } else return
}
```

```js
if (foo) {
  baz()
} else if (bar)
  qux()
else {
  quix()
}
```

## Pass

```js
if (foo) bar()
```

```js
if (foo) {
  bar()
} else {
  baz()
}
```
