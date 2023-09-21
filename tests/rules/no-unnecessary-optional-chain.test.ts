import rule from '../../src/rules/no-unnecessary-optional-chain'
import { ruleTester } from '../tester'

ruleTester.run('no-unnecessary-optional-chain', rule, {
  valid: [
    {
      code: `foo?.bar`,
    },
    {
      code: `if (foo?.bar) { bar = foo.bar }`,
    },
    {
      code: `foo.bar ? foo.bar() : foo.baz`,
    },
    {
      code: `foo?.[qux] && baz(foo[qux])`,
    },
    {
      code: `foo.bar?.baz > foo.bar?.qux`,
    },
  ],
  invalid: [
    {
      code: `[foo]?.bar`,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.literal' },
      ],
      output: `[foo].bar`,
    },
    {
      code: `new Foo()?.bar`,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.literal' },
      ],
      output: `new Foo().bar`,
    },
    {
      code: `if (foo?.bar) { bar = foo?.bar }`,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.non-nullable' },
      ],
      output: `if (foo?.bar) { bar = foo.bar }`,
    },
    {
      code: `foo.bar ? foo.bar?.() : foo.baz`,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.non-nullable' },
      ],
      output: `foo.bar ? foo.bar() : foo.baz`,
    },
    {
      code: `foo?.[qux] && baz(foo?.[qux])`,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.non-nullable' },
      ],
      output: 'foo?.[qux] && baz(foo[qux])',
    },
    {
      code: `foo.bar.baz > foo.bar?.qux`,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.non-nullable' },
      ],
      output: 'foo.bar.baz > foo.bar.qux',
    },
    {
      code: `foo.bar?.baz > foo.bar.qux`,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.non-nullable' },
      ],
      output: 'foo.bar.baz > foo.bar.qux',
    },
  ],
})
