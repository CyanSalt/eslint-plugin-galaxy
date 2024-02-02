import rule from '../../src/vue/no-duplicate-vue-store-mappings'
import { vueRuleTester } from '../tester'

vueRuleTester.run('no-duplicate-vue-store-mappings', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          computed: {
            ...mapState(['foo']),
            ...mapState('bar', ['baz']),
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
        methods: {
          ...mapActions('foo', { bar: 'baz' }),
          ...mapActions('foo', ['qux']),
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
            ...mapState(['bar']),
          },
        }
        </script>
      `,
      errors: [
        {
          messageId: 'no-duplicate-vue-store-mappings',
          data: {
            name: 'mapState',
            line: 5,
          },
        },
      ],
      output: `
        <script>
        export default {
          computed: {
            ...mapState(['foo', 'bar']),
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
          computed: {
            ...mapState([
              'foo',
            ]),
            ...mapState([
              'bar',
            ]),
          },
        }
        </script>
      `,
      errors: [
        {
          messageId: 'no-duplicate-vue-store-mappings',
          data: {
            name: 'mapState',
            line: 5,
          },
        },
      ],
      output: `
        <script>
        export default {
          computed: {
            ...mapState([
              'foo',
'bar',
            ]),
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
          methods: {
            ...mapActions(useFoo, {
              foo: 'bar'
            }),
            ...mapActions(useFoo, {
              bar: 'baz',
            }),
          },
        }
        </script>
      `,
      errors: [
        {
          messageId: 'no-duplicate-vue-store-mappings',
          data: {
            name: 'mapActions',
            line: 5,
          },
        },
      ],
      output: `
        <script>
        export default {
          methods: {
            ...mapActions(useFoo, {
              foo: 'bar',
bar: 'baz'
            }),
          },
        }
        </script>
      `,
    },
  ],
})
