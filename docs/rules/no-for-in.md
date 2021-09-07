# Disallow for-in statements (`no-for-in`)

Looping over objects with a for in loop will include properties that are inherited through the prototype chain. This behavior can lead to unexpected items in your for loop. In most cases, using a for-of statement is the better choice.

## Fail

```js
for (let key in foo) {
  bar[key] = String(foo[key])
}
```

```js
for (let key in foo) {
  if (Object.prototype.hasOwnProperty.call(foo, key)) {
    bar[key] = String(foo[key])
  }
}
```

## Pass

```js
for (let key of Object.keys(foo)) {
  bar[key] = String(foo[key])
}
```

```js
Object.keys(foo).forEach(key => {
  bar[key] = String(foo[key])
})
```
