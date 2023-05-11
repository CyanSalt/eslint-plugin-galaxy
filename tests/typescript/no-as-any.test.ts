import rule from '../../src/typescript/no-as-any'
import { tsRuleTester } from '../tester'

tsRuleTester.run('no-as-any', rule, {
  valid: [
    {
      code: `
        let value = foo() as unknown
      `,
    },
    {
      code: `
        let value = foo() as Foo<any>
      `,
    },
  ],
  invalid: [
    {
      code: `
        let value = foo() as any
      `,
      errors: [
        {
          messageId: 'no-as-any',
        },
      ],
    },
    {
      code: `
        let value = foo() as any[]
      `,
      errors: [
        {
          messageId: 'no-as-any',
        },
      ],
    },
  ],
})
