# Ensure consistent use of file extension within the import path (`import-extensions`)

In order to provide a consistent use of file extensions across your code base, this rule can enforce or disallow the use of certain file extensions.

This rule is based on [import/extensions](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/extensions.md), which behaves essentially the same way except:

- This rule has more possibilities for options.
- This rule is fixable.

## Options

This rule has an enumeration option:

- `"always"` requires adding extensions to paths.
- `"ignorePackages"` requires adding extensions to paths, except for dependency packages.
- `"ignore"` (default) allows any form.
- `"never"` forbids adding extensions to paths.

Or you can provide an object like:

```json
{
  "*": "ignore",
  ".vue": "always"
}
```

So that it will work for certain extensions.

## Fail

```js
/* eslint galaxy/import-extensions: ["error", "always"]*/
import Foo from './foo'
```

```js
/* eslint galaxy/import-extensions: ["error", "always"]*/
import Foo from 'foo/bar'
```

```js
/* eslint galaxy/import-extensions: ["error", "ignorePackages"]*/
import Foo from './foo'
```

```js
/* eslint galaxy/import-extensions: ["error", "never"]*/
import Foo from './foo.js'
```

```js
/* eslint galaxy/import-extensions: ["error", { "*.js": "never" }]*/
import Foo from './foo.js'
```

## Pass

```js
/* eslint galaxy/import-extensions: ["error", "always"]*/
import Foo from './foo.js'
```

```js
/* eslint galaxy/import-extensions: ["error", "always"]*/
import Foo from 'foo/bar.js'
```

```js
/* eslint galaxy/import-extensions: ["error", "ignorePackages"]*/
import Foo from 'foo/bar'
```

```js
/* eslint galaxy/import-extensions: ["error", "never"]*/
import Foo from './foo'
```

```js
/* eslint galaxy/import-extensions: ["error", { "*.js": "never" }]*/
import Foo from './foo'
import Bar from './bar.json'
```
