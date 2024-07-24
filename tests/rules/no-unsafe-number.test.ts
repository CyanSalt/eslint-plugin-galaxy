import rule from '../../src/rules/no-unsafe-number'
import { ruleTester, vueRuleTester } from '../tester'

ruleTester.run('no-unsafe-number', rule, {
  valid: [
    {
      code: `
        const value = foo?.bar + baz
      `,
    },
    {
      code: `
        const value = Number(foo?.bar ?? 0)
      `,
    },
    {
      code: `
        if (Number(foo?.bar)) {}
      `,
    },
  ],
  invalid: [
    {
      code: `
        const value = Number(foo?.bar)
      `,
      errors: [
        {
          messageId: 'no-unsafe-number',
        },
      ],
    },
    {
      code: `
        const value = foo?.bar - 1
      `,
      errors: [
        {
          messageId: 'no-unsafe-number',
        },
      ],
    },
    {
      code: `
        const value = Math.floor(foo?.bar)
      `,
      errors: [
        {
          messageId: 'no-unsafe-number',
        },
      ],
    },
    {
      code: `
        const value = foo?.bar + Number.parseInt(qux)
      `,
      errors: [
        {
          messageId: 'no-unsafe-number',
        },
      ],
    },
  ],
})

vueRuleTester.run('no-unsafe-number', rule, {
  valid: [
    {
      code: `
        <template>
          <Foo v-if="Number(foo?.bar)" />
        </template>
      `,
    },
  ],
  invalid: [
    {
      code: `
        <template>
          <Foo :value="Number(foo?.bar)" />
        </template>
      `,
      errors: [
        {
          messageId: 'no-unsafe-number',
        },
      ],
    },
  ],
})
