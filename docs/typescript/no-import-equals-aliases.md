# Disallow import-equals declarations with a bare identifier (`no-import-equals-aliases`)

TypeScript supports statements in the form of `import Foo = Bar`. In most cases, however, these are unnecessary; you can simply use `Bar` directly, or rename the declaration to `Foo`. More often than not, such statements are added by automated import features in code editors that lack sufficient intelligence.

This rule is partially fixable (when the identifier comes from another import and has no other references).

## Fail

```ts
import Foo = Bar
```

```ts
namespace Bar {}
import Foo = Bar
check(Bar)
```

```ts
import { Bar } from 'foo'
import Foo = Bar
```

```ts
import { Bar } from 'foo'
namespace Baz {
  import Foo = Bar
  check(Foo)
}
```

```ts
import { Bar } from 'foo'
export import Foo = Bar
```

```ts
import { Bar } from 'foo'
namespace Baz {
  export import Foo = Bar
}
```

## Pass

```ts
import { Bar as Foo } from 'foo'
```

```ts
import Foo = Bar.Baz
```

```ts
import Foo = require('foo')
```
