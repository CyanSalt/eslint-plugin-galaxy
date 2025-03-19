import rule from '../../src/rules/no-restricted-floating-promises'
import { ruleTester, tsRuleTester } from '../tester'

ruleTester.run('no-restricted-floating-promises', rule, {
  valid: [
    {
      code: `
        foo()
      `,
    },
    {
      code: `
        bar()
      `,
      options: ['CallExpression[callee.name="foo"]'],
    },
    {
      code: `
        foo().catch(() => {})
      `,
      options: ['CallExpression[callee.name="foo"]'],
    },
    {
      code: `
        foo().then(() => {}, () => {})
      `,
      options: ['CallExpression[callee.name="foo"]'],
    },
    {
      code: `
        await foo()
      `,
      options: ['CallExpression[callee.name="foo"]'],
    },
    {
      code: `
        wrap(foo())
      `,
      options: ['CallExpression[callee.name="foo"]'],
    },
    {
      code: `
        bar()
      `,
      options: [{ names: ['foo'] }],
    },
    {
      code: `
        import { foo } from 'bar'
        foo()
      `,
      options: [{ paths: ['foo'] }],
    },
  ],
  invalid: [
    {
      code: `
        foo()
      `,
      options: ['CallExpression[callee.name="foo"]'],
      errors: [
        {
          messageId: 'no-restricted-floating-promises',
        },
      ],
    },
    {
      code: `
        foo().then(() => {})
      `,
      options: ['CallExpression[callee.name="foo"]'],
      errors: [
        {
          messageId: 'no-restricted-floating-promises',
        },
      ],
    },
    {
      code: `
        Promise.all([foo()])
      `,
      options: ['CallExpression[callee.name="foo"]'],
      errors: [
        {
          messageId: 'no-restricted-floating-promises',
        },
      ],
    },
    {
      code: `
        Promise.resolve(foo())
      `,
      options: ['CallExpression[callee.name="foo"]'],
      errors: [
        {
          messageId: 'no-restricted-floating-promises',
        },
      ],
    },
    {
      code: `
        this.$store.dispatch('submit')
      `,
      options: [{ type: 'vuex-action' }],
      errors: [
        {
          messageId: 'no-restricted-floating-promises',
        },
      ],
    },
    {
      code: `
        this.$confirm({})
      `,
      options: [{ type: 'element-message-box' }],
      errors: [
        {
          messageId: 'no-restricted-floating-promises',
        },
      ],
    },
    {
      code: `
        this.$dialog.confirm({})
      `,
      options: [{ type: 'vant-dialog' }],
      errors: [
        {
          messageId: 'no-restricted-floating-promises',
        },
      ],
    },
    {
      code: `
        foo()
      `,
      options: [{ names: ['foo'] }],
      errors: [
        {
          messageId: 'no-restricted-floating-promises',
        },
      ],
    },
    {
      code: `
        foo.bar()
      `,
      options: [{ names: ['foo'] }],
      errors: [
        {
          messageId: 'no-restricted-floating-promises',
        },
      ],
    },
    {
      code: `
        const { bar } = foo()
        bar()
      `,
      options: [{ names: ['foo'] }],
      errors: [
        {
          messageId: 'no-restricted-floating-promises',
        },
      ],
    },
    {
      code: `
        import { foo } from 'foo'
        foo()
      `,
      options: [{ paths: ['foo'] }],
      errors: [
        {
          messageId: 'no-restricted-floating-promises',
        },
      ],
    },
    {
      code: `
        import foo from 'foo'
        foo.bar()
      `,
      options: [{ paths: ['foo'] }],
      errors: [
        {
          messageId: 'no-restricted-floating-promises',
        },
      ],
    },
    {
      code: `
        import * as foo from 'foo'
        const { bar } = foo()
        bar()
      `,
      options: [{ paths: ['foo'] }],
      errors: [
        {
          messageId: 'no-restricted-floating-promises',
        },
      ],
    },
  ],
})

tsRuleTester.run('no-restricted-floating-promises', rule, {
  valid: [
    {
      code: `
        foo() as unknown
      `,
      options: ['CallExpression[callee.name="foo"]'],
    },
  ],
  invalid: [],
})
