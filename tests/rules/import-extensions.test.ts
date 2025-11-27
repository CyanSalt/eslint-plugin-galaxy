import rule from '../../src/rules/import-extensions'
import { tsRuleTester } from '../tester'

tsRuleTester.run('import-extensions', rule, {
  valid: [
    {
      filename: import.meta.filename,
      code: `import Foo from '../../package.json'`,
      options: ['always'],
    },
    // Built-in modules
    {
      filename: import.meta.filename,
      code: `import * as Foo from 'fs'`,
      options: ['always'],
    },
    // common modules
    {
      filename: import.meta.filename,
      code: `import Foo from 'eslint'`,
      options: ['always'],
    },
    // scoped modules
    {
      filename: import.meta.filename,
      code: `import * as Foo from 'globals'`,
      options: ['always'],
    },
    // TODO: should we also check type imports?
    {
      filename: import.meta.filename,
      code: `import type Foo from '../../package'`,
      options: ['always'],
    },
    {
      filename: import.meta.filename,
      code: `import Foo from '../../package.json'`,
      options: ['ignore'],
    },
    {
      filename: import.meta.filename,
      code: `import Foo from '../../package'`,
      options: ['ignore'],
    },
    {
      filename: import.meta.filename,
      code: `import Foo from 'globals/package.json'`,
      options: ['ignorePackages'],
    },
    {
      filename: import.meta.filename,
      code: `import Foo from 'globals/package'`,
      options: ['ignorePackages'],
    },
    {
      filename: import.meta.filename,
      code: `import Foo from '../../package'`,
      options: ['never'],
    },
    {
      filename: import.meta.filename,
      code: `import Foo from '../../package.json'`,
      options: [{ '.json': 'always' }],
    },
  ],
  invalid: [
    {
      filename: import.meta.filename,
      code: `import Foo from '../../package'`,
      errors: [
        {
          messageId: 'import-extensions.required',
          data: {
            extension: '.json',
            path: '../../package',
          },
        },
      ],
      output: `import Foo from '../../package.json'`,
      options: ['always'],
    },
    {
      filename: import.meta.filename,
      code: `import Foo from 'globals/package'`,
      errors: [
        {
          messageId: 'import-extensions.required',
          data: {
            extension: '.json',
            path: 'globals/package',
          },
        },
      ],
      output: `import Foo from 'globals/package.json'`,
      options: ['always'],
    },
    {
      filename: import.meta.filename,
      code: `import Foo from '../../package'`,
      errors: [
        {
          messageId: 'import-extensions.required',
          data: {
            extension: '.json',
            path: '../../package',
          },
        },
      ],
      output: `import Foo from '../../package.json'`,
      options: ['ignorePackages'],
    },
    {
      filename: import.meta.filename,
      code: `import Foo from '../../package.json'`,
      errors: [
        {
          messageId: 'import-extensions.forbidden',
          data: {
            extension: '.json',
            path: '../../package.json',
          },
        },
      ],
      output: `import Foo from '../../package'`,
      options: ['never'],
    },
  ],
})
