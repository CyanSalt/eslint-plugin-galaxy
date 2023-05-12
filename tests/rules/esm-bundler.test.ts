import rule from '../../src/rules/esm-bundler'
import { ruleTester, vueRuleTester } from '../tester'

ruleTester.run('esm-bundler', rule, {
  valid: [
    {
      code: `
        const version = import.meta.env.VERSION
      `,
    },
    {
      code: `
        export default foo
      `,
    },
    {
      code: `
        import { foo } from 'foo'
      `,
    },
    {
      code: `
        const version = process.env.VERSION
      `,
      options: [{ allowProcessEnv: true }],
    },
    {
      code: `
        const foo = { require: true }
      `,
    },
  ],
  invalid: [
    {
      code: `
        const version = process.env.VERSION
      `,
      errors: [
        {
          messageId: 'esm-bundler.process-env',
          suggestions: [
            {
              messageId: 'suggestion@esm-bundler.import-meta-env',
              output: `
        const version = import.meta.env.VERSION
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
        module.exports = foo
      `,
      errors: [
        {
          messageId: 'esm-bundler.common-js',
        },
      ],
    },
    {
      code: `
        const { foo } = require('foo')
        foo.source = require.resolve('bar')
      `,
      errors: [
        {
          messageId: 'esm-bundler.require',
        },
        {
          messageId: 'esm-bundler.require',
        },
      ],
    },
  ],
})

vueRuleTester.run('esm-bundler', rule, {
  valid: [],
  invalid: [
    {
      code: `
        <template>
          <img :src="process.env.IMAGE_URL">
        </template>
      `,
      errors: [
        {
          messageId: 'esm-bundler.process-env',
        },
      ],
    },
    {
      code: `
        <template>
          <img :src="require('foo')">
        </template>
      `,
      errors: [
        {
          messageId: 'esm-bundler.require',
        },
      ],
    },
  ],
})
