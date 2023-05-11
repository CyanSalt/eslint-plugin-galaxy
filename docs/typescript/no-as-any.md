# Disallow `any` type assertions (`no-as-any`)

> After all, remember that all the convenience of `any` comes at the cost of losing type safety.

Asserting the type as `any` avoids most type problems, but this usually leads to type insecurity. In most cases, using a non-empty assertion, asserting it as a definite type, or using `as never` will solve the problem.

## Fail

```js
let value = foo() as any
```

```js
let value = foo() as any[]
```

## Pass

```js
let value = foo() as unknown
```

```js
let value = foo() as Foo<any>
```
