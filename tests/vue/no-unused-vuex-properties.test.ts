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
    // References by watchers
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          computed: {
            ...mapState(['foo']),
          },
          watch: {
            foo: 'bar',
          },
          methods: {
            ...mapActions(['bar']),
          },
        }
        </script>
      `,
    },
    // References by computed function bindings
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          computed: {
            ...mapState(['foo', 'bar']),
            baz: vm => vm.foo,
            qux: {
              get: vm => vm.bar,
              set: () => {},
            },
          },
        }
        </script>
      `,
    },
    // Bindings in style block
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
        <style scoped>
        .bar {
          color: v-bind(foo)
        }
        </style>
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
    // Only functions in computed properties will reference properties
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          computed: {
            ...mapState(['foo']),
          },
          watch: {
            bar: value => value.foo,
            baz: {
              handler: value => value.foo,
            },
          },
          qux: {
            quux: {
              quuz: {
                corge: vm => vm.foo,
              },
            },
          },
          quux: vm => vm.foo,
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
