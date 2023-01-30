# Disallow global variables that may be misused (`no-misused-globals`)

In JavaScript, all global variables are properties of the global object and vice versa. This feature leads to times when we accidentally use global variables without noticing them, e.g.

- Import statement is missing while a method of the same name happens to exist in the global object
- Moving code without moving the variable declaration, but the variable of the same name happens to be a global variable

This rule tries to check for these cases.

This rule cannot specify global variables. `no-restricted-globals` can be used if required.

## Options

This rule has an object option:

- `"prototypeBuiltins"` (default `true`) disallows properties from the prototype of Object
- `"deprecated"` (default `true`) disallows deprecated global DOM properties and methods
- `"events"` (default `true`) disallows the properties of the global object as an event target
- `"ambiguousSingleWords"` (default `true`) disallows uncommon, ambiguous global variables with single-word names

## Fail

```js
if (hasOwnProperty('foo')) {}
```

```js
event.target.focus()
```

```js
onbeforeunload = () => false
```

```js
open(door)
```

## Pass

```js
location.href = ''
setTimeout(foo, 1000)
process.exit()
require('os')
```
