import rule from '../../src/vue/conventional-vue-keys-order'
import { ruleTester } from '../tester'

ruleTester.run('conventional-vue-keys-order', rule, {
  valid: [
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['model'],
        },
      ],
      code: `
        export default {
          model: {
            prop: 'value',
            event: 'input',
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['props'],
        },
      ],
      code: `
        export default {
          props: {
            foo: {
              required: true,
              type: String,
            },
            bar: {
              type: String,
              default: '',
            },
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['props-properties'],
        },
      ],
      code: `
        export default {
          props: {
            foo: {
              type: String,
              required: true,
            },
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['inject-properties'],
        },
      ],
      code: `
        export default {
          inject: {
            foo: {
              from: 'bar',
              default: '',
            },
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['emits'],
        },
      ],
      code: `
        export default {
          emits: {
            'update:foo': () => true,
            foo: () => true,
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['data-return'],
        },
      ],
      code: `
        export default {
          data() {
            return {
              FooBar,
              baz: 1,
            }
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['computed'],
        },
      ],
      code: `
        export default {
          computed: {
            ...mapState(['foo']),
            bar() {
              return true
            },
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['computed-strict'],
        },
      ],
      code: `
        export default {
          computed: {
            ...mapState(['foo']),
            ...mapGetters(['bar']),
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['watch-properties'],
        },
      ],
      code: `
        export default {
          watch: {
            foo: {
              handler(value) {
                this.bar = value
              },
              deep: true,
            },
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['methods'],
        },
      ],
      code: `
        export default {
          methods: {
            ...mapActions(['foo']),
            bar() {
              return true
            },
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['methods-strict'],
        },
      ],
      code: `
        export default {
          methods: {
            ...mapMutations(['foo']),
            ...mapActions(['bar']),
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          additionalRules: [
            {
              key: 'foo',
              order: ['bar', 'baz'],
            },
          ],
        },
      ],
      code: `
        export default {
          foo: {
            bar: 1,
            baz: 2,
          },
        }
      `,
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['model'],
        },
      ],
      code: `
        export default {
          model: {
            event: 'input',
            prop: 'value',
          },
        }
      `,
      errors: [
        {
          messageId: 'conventional-vue-keys-order',
          data: { line: 4 },
        },
      ],
      output: `
        export default {
          model: {
            prop: 'value',
            event: 'input',
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['props'],
        },
      ],
      code: `
        export default {
          props: {
            bar: {
              type: String,
              default: '',
            },
            foo: {
              type: String,
              required: true,
            },
          },
        }
      `,
      errors: [
        {
          messageId: 'conventional-vue-keys-order',
          data: { line: 4 },
        },
      ],
      output: `
        export default {
          props: {
            foo: {
              type: String,
              required: true,
            },
            bar: {
              type: String,
              default: '',
            },
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['props-properties'],
        },
      ],
      code: `
        export default {
          props: {
            foo: {
              required: true,
              type: String,
            },
          },
        }
      `,
      errors: [
        {
          messageId: 'conventional-vue-keys-order',
          data: { line: 5 },
        },
      ],
      output: `
        export default {
          props: {
            foo: {
              type: String,
              required: true,
            },
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['inject-properties'],
        },
      ],
      code: `
        export default {
          inject: {
            foo: {
              default: '',
              from: 'bar',
            },
          },
        }
      `,
      errors: [
        {
          messageId: 'conventional-vue-keys-order',
          data: { line: 5 },
        },
      ],
      output: `
        export default {
          inject: {
            foo: {
              from: 'bar',
              default: '',
            },
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['emits'],
        },
      ],
      code: `
        export default {
          emits: {
            foo: () => true,
            'update:foo': () => true,
          },
        }
      `,
      errors: [
        {
          messageId: 'conventional-vue-keys-order',
          data: { line: 4 },
        },
      ],
      output: `
        export default {
          emits: {
            'update:foo': () => true,
            foo: () => true,
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['data-return'],
        },
      ],
      code: `
        export default {
          data() {
            return {
              baz: 1,
              FooBar,
            }
          },
        }
      `,
      errors: [
        {
          messageId: 'conventional-vue-keys-order',
          data: { line: 5 },
        },
      ],
      output: `
        export default {
          data() {
            return {
              FooBar,
              baz: 1,
            }
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['computed'],
        },
      ],
      code: `
        export default {
          computed: {
            bar() {
              return true
            },
            ...mapState(['foo']),
          },
        }
      `,
      errors: [
        {
          messageId: 'conventional-vue-keys-order',
          data: { line: 4 },
        },
      ],
      output: `
        export default {
          computed: {
            ...mapState(['foo']),
            bar() {
              return true
            },
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['computed-strict'],
        },
      ],
      code: `
        export default {
          computed: {
            ...mapGetters(['bar']),
            ...mapState(['foo']),
          },
        }
      `,
      errors: [
        {
          messageId: 'conventional-vue-keys-order',
          data: { line: 4 },
        },
      ],
      output: `
        export default {
          computed: {
            ...mapState(['foo']),
            ...mapGetters(['bar']),
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['watch-properties'],
        },
      ],
      code: `
        export default {
          watch: {
            foo: {
              deep: true,
              handler(value) {
                this.bar = value
              },
            },
          },
        }
      `,
      errors: [
        {
          messageId: 'conventional-vue-keys-order',
          data: { line: 5 },
        },
      ],
      output: `
        export default {
          watch: {
            foo: {
              handler(value) {
                this.bar = value
              },
              deep: true,
            },
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['methods'],
        },
      ],
      code: `
        export default {
          methods: {
            bar() {
              return true
            },
            ...mapActions(['foo']),
          },
        }
      `,
      errors: [
        {
          messageId: 'conventional-vue-keys-order',
          data: { line: 4 },
        },
      ],
      output: `
        export default {
          methods: {
            ...mapActions(['foo']),
            bar() {
              return true
            },
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          rules: ['methods-strict'],
        },
      ],
      code: `
        export default {
          methods: {
            ...mapActions(['bar']),
            ...mapMutations(['foo']),
          },
        }
      `,
      errors: [
        {
          messageId: 'conventional-vue-keys-order',
          data: { line: 4 },
        },
      ],
      output: `
        export default {
          methods: {
            ...mapMutations(['foo']),
            ...mapActions(['bar']),
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      options: [
        {
          additionalRules: [
            {
              key: 'foo',
              order: ['bar', 'baz'],
            },
          ],
        },
      ],
      code: `
        export default {
          foo: {
            baz: 2,
            bar: 1,
          },
        }
      `,
      errors: [
        {
          messageId: 'conventional-vue-keys-order',
          data: { line: 4 },
        },
      ],
      output: `
        export default {
          foo: {
            bar: 1,
            baz: 2,
          },
        }
      `,
    },
  ],
})
