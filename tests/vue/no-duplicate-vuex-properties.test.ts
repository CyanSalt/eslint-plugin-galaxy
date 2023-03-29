import rule from '../../src/vue/no-duplicate-vuex-properties'
import { ruleTester } from '../tester'

ruleTester.run('no-duplicate-vuex-properties', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        export default {
          computed: {
            ...mapState(['foo']),
            bar() {
              return this.baz
            },
          },
        }
      `,
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        export default {
          computed: {
            ...mapState(['foo']),
            foo() {
              return this.bar
            },
          },
        }
      `,
      errors: [
        {
          messageId: 'no-duplicate-vuex-properties',
          data: {
            name: 'foo',
            line: 5,
          },
          suggestions: [
            {
              messageId: 'suggestion@no-duplicate-vuex-properties.remove',
              output: `
        export default {
          computed: {
            ...mapState([]),
            foo() {
              return this.bar
            },
          },
        }
      `,
            },
          ],
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          computed: {
            ...mapState(['foo']),
            ...mapState('bar', ['foo', 'baz']),
          },
        }
      `,
      errors: [
        {
          messageId: 'no-duplicate-vuex-properties',
          data: {
            name: 'foo',
            line: 4,
          },
          suggestions: [
            {
              messageId: 'suggestion@no-duplicate-vuex-properties.remove',
              output: `
        export default {
          computed: {
            ...mapState(['foo']),
            ...mapState('bar', [ 'baz']),
          },
        }
      `,
            },
          ],
        },
      ],
    },
  ],
})
