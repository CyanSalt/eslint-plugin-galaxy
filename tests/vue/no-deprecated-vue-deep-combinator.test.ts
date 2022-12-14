import rule from '../../src/vue/no-deprecated-vue-deep-combinator'
import { vueRuleTester } from '../tester'

vueRuleTester.run('no-deprecated-vue-deep-combinator', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        <style scoped>
        .foo {
          display: block;
        }
        </style>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <style scoped>
        .foo :deep(.bar) {
          display: block;
        }
        </style>
      `,
    },
    // Non-scoped style
    {
      filename: 'test.vue',
      code: `
        <style>
        .foo ::v-deep .bar {
          display: block;
        }
        </style>
      `,
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        <style scoped>
        .foo ::v-deep .bar {
          display: block;
        }
        </style>
      `,
      errors: [
        { messageId: 'no-deprecated-vue-deep-combinator' },
      ],
      output: `
        <style scoped>
        .foo :deep(.bar) {
          display: block;
        }
        </style>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <style scoped>
        .foo ::v-deep(.bar) {
          display: block;
        }
        </style>
      `,
      errors: [
        { messageId: 'no-deprecated-vue-deep-combinator' },
      ],
      output: `
        <style scoped>
        .foo :deep(.bar) {
          display: block;
        }
        </style>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <style lang="scss" scoped>
        .foo ::v-deep {
          .bar {
            display: block;
          }
        }
        </style>
      `,
      errors: [
        { messageId: 'no-deprecated-vue-deep-combinator' },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <style scoped>
        ::v-deep .foo .bar {
          display: block;
        }
        </style>
      `,
      errors: [
        { messageId: 'no-deprecated-vue-deep-combinator' },
      ],
      output: `
        <style scoped>
        :deep(.foo .bar) {
          display: block;
        }
        </style>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <style scoped>
        ::v-deep .foo, .bar {
          display: block;
        }
        </style>
      `,
      errors: [
        { messageId: 'no-deprecated-vue-deep-combinator' },
      ],
      output: `
        <style scoped>
        :deep(.foo), .bar {
          display: block;
        }
        </style>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <style scoped>
        .foo ::v-deep .bar {
          display: block;
          &__baz {
            display: inline;
          }
        }
        </style>
      `,
      errors: [
        { messageId: 'no-deprecated-vue-deep-combinator' },
      ],
      output: `
        <style scoped>
        .foo ::v-deep .bar {
          display: block;
        }
.foo ::v-deep .bar__baz {
            display: inline;
          }
        </style>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <style scoped>
        .foo ::v-deep .bar {
          &__baz {
            display: inline;
          }
        }
        .qux {}
        </style>
      `,
      errors: [
        { messageId: 'no-deprecated-vue-deep-combinator' },
      ],
      output: `
        <style scoped>
        .foo ::v-deep .bar__baz {
            display: inline;
          }
        .qux {}
        </style>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <style scoped>
        ::v-deep .foo, .bar {
          &__baz {
            display: inline;
          }
        }
        </style>
      `,
      errors: [
        { messageId: 'no-deprecated-vue-deep-combinator' },
      ],
      output: `
        <style scoped>
        ::v-deep .foo__baz, .bar__baz {
            display: inline;
          }
        </style>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <style scoped>
        .foo ::v-deep .bar {
          @include baz {
            &__qux {
              display: inline;
            }
          }
        }
        </style>
      `,
      errors: [
        { messageId: 'no-deprecated-vue-deep-combinator' },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <style scoped>
        .foo ::v-deep .bar {
          @include baz {
            display: block;
            &__qux {
              display: inline;
            }
          }
        }
        </style>
      `,
      errors: [
        { messageId: 'no-deprecated-vue-deep-combinator' },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <style scoped>
        .foo {
          ::v-deep & .bar {
            display: block;
          }
        }
        </style>
      `,
      errors: [
        { messageId: 'no-deprecated-vue-deep-combinator' },
      ],
      output: `
        <style scoped>
        ::v-deep .foo .bar {
            display: block;
          }
        </style>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <style scoped>
        .foo {
          @include baz {
            ::v-deep & .bar {
              display: block;
            }
          }
        }
        </style>
      `,
      errors: [
        { messageId: 'no-deprecated-vue-deep-combinator' },
      ],
    },
  ],
})
