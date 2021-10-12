import rule from '../../src/vue/no-unused-vuex-properties'
import { vueRuleTester } from '../tester'

vueRuleTester.run('no-unused-vuex-properties', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        <template>
          <p>{{ foo }}</p>
        </template>

        <script>
        export default {
          computed: {
            ...mapState(['foo']),
          },
        }
        </script>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          created() {
            this.bar()
          },
          methods: {
            ...mapActions(['bar']),
          },
        }
        </script>
      `,
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          computed: {
            ...mapState(['foo']),
          },
        }
        </script>
      `,
      errors: [
        { message: 'Property "foo" is never used.' } as any,
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          computed: {
            ...mapGetters('bar', { myBaz: 'baz' }),
          },
        }
        </script>
      `,
      errors: [
        { message: 'Property "myBaz" is never used.' } as any,
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          methods: {
            ...mapActions(['qux']),
          },
        }
        </script>
      `,
      errors: [
        { message: 'Property "qux" is never used.' } as any,
      ],
    },
  ],
})
