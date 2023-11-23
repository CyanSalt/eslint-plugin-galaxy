import rule from '../../src/rules/no-restricted-barrel-imports'
import { tsRuleTester } from '../tester'

tsRuleTester.run('no-restricted-barrel-imports', rule, {
  valid: [
    {
      filename: __filename,
      code: `import { foo } from '../samples/barrel-exports-deep'`,
      options: [{ files: [require.resolve('../samples/barrel-exports')] }],
    },
  ],
  invalid: [
    {
      filename: __filename,
      code: `import { foo } from '../samples/barrel-exports'`,
      errors: [
        {
          messageId: 'no-restricted-barrel-imports',
          data: {
            importSource: '../samples/barrel-exports',
          },
        },
      ],
      output: `import { foo } from '../samples/barrel-exports-deep'`,
      options: [{ files: [require.resolve('../samples/barrel-exports')] }],
    },
  ],
})
