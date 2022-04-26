import rule from '../../src/rules/no-restricted-floating-promises'
import { ruleTester } from '../tester'

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
        Promise.all([foo()])
      `,
      options: ['CallExpression[callee.name="foo"]'],
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
  ],
})
