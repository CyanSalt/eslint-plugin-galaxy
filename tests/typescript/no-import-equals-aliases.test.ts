import rule from '../../src/typescript/no-import-equals-aliases'
import { tsRuleTester } from '../tester'

tsRuleTester.run('no-import-equals-aliases', rule, {
  valid: [
    {
      code: `import { Bar as Foo } from 'foo'`,
    },
    {
      code: `import Foo = Bar.Baz`,
    },
    {
      code: `import Foo = require('foo')`,
    },
  ],
  invalid: [
    {
      code: `import Foo = Bar`,
      errors: [
        {
          messageId: 'no-import-equals-aliases',
        },
      ],
    },
    {
      code: `
        namespace Bar {}
        import Foo = Bar
        check(Bar)
      `,
      errors: [
        {
          messageId: 'no-import-equals-aliases',
        },
      ],
    },
    {
      code: `
        import { Bar } from 'foo'
        import Foo = Bar
      `,
      output: `
        import { Bar as Foo } from 'foo'
      `,
      errors: [
        {
          messageId: 'no-import-equals-aliases',
        },
      ],
    },
    {
      code: `
        import { Bar } from 'foo'
        namespace Baz {
          import Foo = Bar
          check(Foo)
        }
      `,
      output: `
        import { Bar as Foo } from 'foo'
        namespace Baz {
          check(Foo)
        }
      `,
      errors: [
        {
          messageId: 'no-import-equals-aliases',
        },
      ],
    },
    {
      code: `
        import { Bar } from 'foo'
        export import Foo = Bar
      `,
      output: `
        import { Bar as Foo } from 'foo'
        export { Foo }
      `,
      errors: [
        {
          messageId: 'no-import-equals-aliases',
        },
      ],
    },
    {
      code: `
        import { Bar } from 'foo'
        export import Foo = Bar
        check(Foo)
      `,
      output: `
        import { Bar as Foo } from 'foo'
        export { Foo }
        check(Foo)
      `,
      errors: [
        {
          messageId: 'no-import-equals-aliases',
        },
      ],
    },
    {
      code: `
        import { Bar } from 'foo'
        namespace Baz {
          export import Foo = Bar
        }
      `,
      errors: [
        {
          messageId: 'no-import-equals-aliases',
        },
      ],
    },
    {
      code: `
        import Bar = require('foo')
        import Foo = Bar
      `,
      output: `
        import Foo = require('foo')
      `,
      errors: [
        {
          messageId: 'no-import-equals-aliases',
        },
      ],
    },
    {
      code: `
        import { Bar as Baz } from 'foo'
        import Foo = Baz
      `,
      output: `
        import { Bar as Foo } from 'foo'
      `,
      errors: [
        {
          messageId: 'no-import-equals-aliases',
        },
      ],
    },
    {
      code: `
        import Bar from 'foo'
        import Foo = Bar
      `,
      output: `
        import Foo from 'foo'
      `,
      errors: [
        {
          messageId: 'no-import-equals-aliases',
        },
      ],
    },
    {
      code: `
        import Foo = Bar.Baz
        import Qux = Foo
      `,
      output: `
        import Qux = Bar.Baz
      `,
      errors: [
        {
          messageId: 'no-import-equals-aliases',
        },
      ],
    },
  ],
})
