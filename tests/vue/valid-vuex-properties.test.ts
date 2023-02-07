import rule from '../../src/vue/valid-vuex-properties'
import { ruleTester } from '../tester'

ruleTester.run('valid-vuex-properties', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        export default {
          computed: {
            ...mapState({
              foo: state => state.foo,
            }),
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
            ...mapState({
              foo() {
                return this.bar
              },
            }),
          },
        }
      `,
      errors: [
        {
          messageId: 'valid-vuex-properties.this',
          data: {
            name: 'mapState',
          },
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          computed: {
            ...mapGetters({
              foo(state) {
                return 'bar'
              },
            }),
          },
        }
      `,
      errors: [
        {
          messageId: 'valid-vuex-properties.arguments',
          data: {
            name: 'mapGetters',
          },
        },
      ],
    },
  ],
})
