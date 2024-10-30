# Disallow duplicate composition calls from specified paths (`no-duplicate-vue-uses`)

Most compositions in Vue support being called multiple times. However, for some modules, the results of multiple calls are actually the same, such as `pinia` or `vue-router`, but it may affect code readability.

This rule attempts to merge function call variable declarations starting with `use` imported from specific modules.

This rule is partially fixable (when two or more composition has the same usages).

## Options

This rule has an object option:

- `"paths"` specifies module paths in glob patterns
- `"ignoreDifferentUsages"` ignores different usages of the same module, which could not be fixed

## Fail

```js
/* eslint galaxy/no-duplicate-vue-uses: ["error", { "paths": ["@foo/**"] }] */
import { useFoo } from '@foo/bar'

const {
  foo,
} = useFoo()
let { bar } = useFoo()
```

```js
/* eslint galaxy/no-duplicate-vue-uses: ["error", { "paths": ["@foo/**"] }] */
import { useFoo } from '@foo/bar'

const foo = useFoo()
let { bar } = useFoo()
```

```js
/* eslint galaxy/no-duplicate-vue-uses: ["error", { "paths": ["@foo/**"] }] */
import { useFoo } from '@foo/bar'

const { foo } = $(useFoo())
const { bar } = useFoo()
```

## Pass

```js
/* eslint galaxy/no-duplicate-vue-uses: ["error", { "paths": ["@foo/**"] }] */
import { useFoo } from '@foo/bar'

const { foo } = useFoo()
```

```js
/* eslint galaxy/no-duplicate-vue-uses: ["error", { "paths": ["@foo/**"] }] */
import { useFoo, useBar } from '@foo/bar'

const { foo } = useFoo()
const { bar } = useBar()
```

```js
/* eslint galaxy/no-duplicate-vue-uses: ["error", { "paths": ["@bar/**"] }] */
import { useFoo } from '@foo/bar'

const { foo } = useFoo()
const { bar } = useFoo()
```

```js
/* eslint galaxy/no-duplicate-vue-uses: ["error", { "paths": ["@foo/**"], "ignoreDifferentUsages": true }] */
import { useFoo } from '@foo/bar'

const { foo } = $(useFoo())
const { bar } = useFoo()
```
