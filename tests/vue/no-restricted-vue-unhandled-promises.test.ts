import rule from '../../src/vue/no-restricted-vue-unhandled-promises'
import { vueRuleTester } from '../tester'

vueRuleTester.run('no-restricted-vue-unhandled-promises', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          async created() {
            await foo()
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
          async created() {
            await bar()
          },
        }
        </script>
      `,
      options: ['CallExpression[callee.name="foo"]'],
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          async created() {
            try {
              await foo()
            } catch {}
          },
        }
        </script>
      `,
      options: ['CallExpression[callee.name="foo"]'],
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          async created() {
            await foo().catch(() => {})
          },
        }
        </script>
      `,
      options: ['CallExpression[callee.name="foo"]'],
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          async created() {
            try {
              await Promise.all([
                foo(),
              ])
            } catch {}
          },
        }
        </script>
      `,
      options: ['CallExpression[callee.name="foo"]'],
    },
    {
      filename: 'test.vue',
      code: `
        <script setup>
        watchEffect(async () => {
          try {
            await foo()
          } catch {}
        })
        </script>
      `,
      options: ['CallExpression[callee.name="foo"]'],
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        import { foo } from 'bar'
        export default {
          async created() {
            await foo()
          },
        }
        </script>
      `,
      options: [{ paths: ['foo'] }],
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          async created() {
            await foo()
          },
        }
        </script>
      `,
      options: ['CallExpression[callee.name="foo"]'],
      errors: [
        {
          messageId: 'no-restricted-vue-unhandled-promises',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          created() {
            return foo()
          },
        }
        </script>
      `,
      options: ['CallExpression[callee.name="foo"]'],
      errors: [
        {
          messageId: 'no-restricted-vue-unhandled-promises',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          watch: {
            async bar() {
              await foo()
            },
          },
        }
        </script>
      `,
      options: ['CallExpression[callee.name="foo"]'],
      errors: [
        {
          messageId: 'no-restricted-vue-unhandled-promises',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <span @click="bar"></span>
        </template>

        <script>
        export default {
          methods: {
            async bar() {
              await foo()
            },
          },
        }
        </script>
      `,
      options: ['CallExpression[callee.name="foo"]'],
      errors: [
        {
          messageId: 'no-restricted-vue-unhandled-promises',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          setup() {
            onMounted(async () => {
              await foo()
            })
          },
        }
        </script>
      `,
      options: ['CallExpression[callee.name="foo"]'],
      errors: [
        {
          messageId: 'no-restricted-vue-unhandled-promises',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script setup>
        watch(() => props.bar, async () => {
          await foo()
        })
        </script>
      `,
      options: ['CallExpression[callee.name="foo"]'],
      errors: [
        {
          messageId: 'no-restricted-vue-unhandled-promises',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script setup>
        async function bar() {
          await foo()
        }
        </script>

        <template>
          <span @click="bar"></span>
        </template>
      `,
      options: ['CallExpression[callee.name="foo"]'],
      errors: [
        {
          messageId: 'no-restricted-vue-unhandled-promises',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          async created() {
            await this.bar()
          },
          methods: {
            async bar() {
              await foo()
            },
          }
        }
        </script>
      `,
      options: ['CallExpression[callee.name="foo"]'],
      errors: [
        {
          messageId: 'no-restricted-vue-unhandled-promises',
        },
      ],
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
            async bar() {
              await foo()
            },
          }
        }
        </script>
      `,
      options: ['CallExpression[callee.name="foo"]'],
      errors: [
        {
          messageId: 'no-restricted-vue-unhandled-promises',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script setup>
        onMounted(async () => {
          await bar()
        })
        async function bar() {
          await foo()
        }
        </script>
      `,
      options: ['CallExpression[callee.name="foo"]'],
      errors: [
        {
          messageId: 'no-restricted-vue-unhandled-promises',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script setup>
        onMounted(() => {
          bar()
        })
        async function bar() {
          await foo()
        }
        </script>
      `,
      options: ['CallExpression[callee.name="foo"]'],
      errors: [
        {
          messageId: 'no-restricted-vue-unhandled-promises',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          async created() {
            await this.$store.dispatch('submit')
          },
        }
        </script>
      `,
      options: [{ type: 'vuex-action' }],
      errors: [
        {
          messageId: 'no-restricted-vue-unhandled-promises',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          async created() {
            await this.$confirm({})
          },
        }
        </script>
      `,
      options: [{ type: 'element-message-box' }],
      errors: [
        {
          messageId: 'no-restricted-vue-unhandled-promises',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        export default {
          async created() {
            await this.$dialog.confirm({})
          },
        }
        </script>
      `,
      options: [{ type: 'vant-dialog' }],
      errors: [
        {
          messageId: 'no-restricted-vue-unhandled-promises',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script>
        import { foo } from 'foo'
        export default {
          async created() {
            await foo()
          },
        }
        </script>
      `,
      options: [{ paths: ['foo'] }],
      errors: [
        {
          messageId: 'no-restricted-vue-unhandled-promises',
        },
      ],
    },
  ],
})
