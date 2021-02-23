# Disallow unsafe `window.open()` (`no-unsafe-window-open`)

`window.open()` will mount the new window with the parent window in one process by default, which will make the parent accessible in the child by visiting `window.opener`. In some cases, this makes phishing attacks possible, or brings some performance issues.

This rule will not check `window.open()` with the third argument. You can pass an empty string if you really need to disable it.

This rule is partly fixable.

## Fail

```js
window.open(url);
```

```js
// Won't be fixed automatically
const child = window.open(url);
```

## Pass

```js
window.open(url, '_blank', 'noopener');
```

```js
window.open(url, '_blank', ''); // will be skipped
```
