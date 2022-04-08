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
        {
          messageId: 'no-unused-vuex-properties',
          data: {
            name: 'foo',
          },
        },
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
        {
          messageId: 'no-unused-vuex-properties',
          data: {
            name: 'myBaz',
          },
        },
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
        {
          messageId: 'no-unused-vuex-properties',
          data: {
            name: 'qux',
          },
        },
      ],
    },
  ],
})
