import rule from '../../src/rules/no-prototype-as-value'
import { tsRuleTester } from '../tester'

tsRuleTester.run('no-prototype-as-value', rule, {
  valid: [
    {
      code: `
        foo.toString()
      `,
    },
    {
      code: `
        Object.prototype.toString.call(foo)
      `,
    },
    {
      code: `
        Array.prototype[foo].call(bar, baz)
      `,
    },
    {
      code: `
        Array.prototype.foo = bar;
      `,
    },
    {
      code: `
        const bar = Array.prototype.foo;
      `,
    },
    {
      code: `
        Object.defineProperty(Array.prototype, foo, bar)
      `,
    },
    {
      code: `
        if ('foo' in Array.prototype) {}
      `,
    },
    {
      code: `
        expect(Object.create(null).prototype).toBe(null)
      `,
      options: [
        { ignores: ['expect'] },
      ],
    },
  ],
  invalid: [
    {
      code: `
        const noop = Function.prototype
      `,
      errors: [
        {
          messageId: 'no-prototype-as-value.prototype',
          suggestions: [
            {
              messageId: 'suggestion@no-prototype-as-value.literals',
              output: `
        const noop = () => {}
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
        const proxy = new Proxy(Object.prototype, {})
      `,
      errors: [
        {
          messageId: 'no-prototype-as-value.prototype',
          suggestions: [
            {
              messageId: 'suggestion@no-prototype-as-value.literals',
              output: `
        const proxy = new Proxy({}, {})
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
        return foo.map(Number.prototype.toFixed, bar)
      `,
      errors: [
        {
          messageId: 'no-prototype-as-value.method',
        },
      ],
    },
    {
      code: `
        let bar = Array.prototype.foo
      `,
      errors: [
        {
          messageId: 'no-prototype-as-value.method',
        },
      ],
    },
  ],
})
