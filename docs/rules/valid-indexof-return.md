# Disallow boolean cast of returning value of `.indexOf()` (`valid-indexof-return`)

The `.indexOf()` methods for both String and Array return numeric types. In some cases, it can be confused with the `.includes()` method and used as a boolean type.

## Fail

```js
if (arr.indexOf(x)) {}
```

```js
arr.indexOf(x) ? foo : bar
```

```js
arr.indexOf(x) && arr.map(item => item.id)
```

## Pass

```js
if (arr.indexOf(x) !== -1) {}
```

```js
arr.includes(x) ? foo : bar
```

```js
arr.indexOf(x) + offset
```
