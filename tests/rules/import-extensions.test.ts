/**
 * @jest-environment node
 */
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
      code: `import Foo from '@typescript-eslint/experimental-utils/package.json'`,
      options: ['ignorePackages'],
    },
    {
      filename: __filename,
      code: `import Foo from '@typescript-eslint/experimental-utils/package'`,
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
        { message: 'Missing file extension ".json" for "../../package"' } as any,
      ],
      output: `import Foo from '../../package.json'`,
      options: ['always'],
    },
    {
      filename: __filename,
      code: `import Foo from '@typescript-eslint/experimental-utils/package'`,
      errors: [
        { message: 'Missing file extension ".json" for "@typescript-eslint/experimental-utils/package"' } as any,
      ],
      output: `import Foo from '@typescript-eslint/experimental-utils/package.json'`,
      options: ['always'],
    },
    {
      filename: __filename,
      code: `import Foo from '@typescript-eslint/experimental-utils/dist'`,
      errors: [
        { message: 'Missing file extension ".js" for "@typescript-eslint/experimental-utils/dist"' } as any,
      ],
      output: `import Foo from '@typescript-eslint/experimental-utils/dist/index.js'`,
      options: ['always'],
    },
    {
      filename: __filename,
      code: `import Foo from '../../package'`,
      errors: [
        { message: 'Missing file extension ".json" for "../../package"' } as any,
      ],
      output: `import Foo from '../../package.json'`,
      options: ['ignorePackages'],
    },
    {
      filename: __filename,
      code: `import Foo from '../../package.json'`,
      errors: [
        { message: 'Unexpected use of file extension ".json" for "../../package.json"' } as any,
      ],
      output: `import Foo from '../../package'`,
      options: ['never'],
    },
    {
      filename: __filename,
      code: `import Foo from '@typescript-eslint/experimental-utils/dist/index.js'`,
      errors: [
        { message: 'Unexpected use of file extension ".js" for "@typescript-eslint/experimental-utils/dist/index.js"' } as any,
      ],
      output: `import Foo from '@typescript-eslint/experimental-utils/dist'`,
      options: ['never'],
    },
  ],
})
