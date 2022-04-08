import rule from '../../src/rules/import-extensions'
import { ruleTester } from '../tester'

ruleTester.run('import-extensions', rule, {
  valid: [
    {
      filename: __filename,
      code: `import Foo from '../../package.json'`,
      options: ['always'],
    },
    {
      filename: __filename,
      code: `import Foo from '../../package.json'`,
      options: ['ignore'],
    },
    {
      filename: __filename,
      code: `import Foo from '../../package'`,
      options: ['ignore'],
    },
    {
      filename: __filename,
      code: `import Foo from '@typescript-eslint/utils/package.json'`,
      options: ['ignorePackages'],
    },
    {
      filename: __filename,
      code: `import Foo from '@typescript-eslint/utils/package'`,
      options: ['ignorePackages'],
    },
    {
      filename: __filename,
      code: `import Foo from '../../package'`,
      options: ['never'],
    },
  ],
  invalid: [
    {
      filename: __filename,
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
      filename: __filename,
      code: `import Foo from '@typescript-eslint/utils/package'`,
      errors: [
        {
          messageId: 'import-extensions.required',
          data: {
            extension: '.json',
            path: '@typescript-eslint/utils/package',
          },
        },
      ],
      output: `import Foo from '@typescript-eslint/utils/package.json'`,
      options: ['always'],
    },
    {
      filename: __filename,
      code: `import Foo from '@typescript-eslint/utils/dist'`,
      errors: [
        {
          messageId: 'import-extensions.required',
          data: {
            extension: '.js',
            path: '@typescript-eslint/utils/dist',
          },
        },
      ],
      output: `import Foo from '@typescript-eslint/utils/dist/index.js'`,
      options: ['always'],
    },
    {
      filename: __filename,
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
      filename: __filename,
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
    {
      filename: __filename,
      code: `import Foo from '@typescript-eslint/utils/dist/index.js'`,
      errors: [
        {
          messageId: 'import-extensions.forbidden',
          data: {
            extension: '.js',
            path: '@typescript-eslint/utils/dist/index.js',
          },
        },
      ],
      output: `import Foo from '@typescript-eslint/utils/dist'`,
      options: ['never'],
    },
  ],
})
