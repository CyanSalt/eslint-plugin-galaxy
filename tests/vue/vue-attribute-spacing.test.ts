import rule from '../../src/vue/vue-attribute-spacing'
import { vueRuleTester } from '../tester'

vueRuleTester.run('vue-attribute-spacing', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        <template>
          <p :foo="bar"></p>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p foo=" bar "></p>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p>{{ bar }}</p>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p :foo=" bar "></p>
        </template>
      `,
      options: ['always'],
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p foo="bar"></p>
        </template>
      `,
      options: ['always'],
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p>{{bar}}</p>
        </template>
      `,
      options: ['always'],
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        <template>
          <p v-foo=" bar"></p>
        </template>
      `,
      errors: [
        {
          messageId: 'vue-attribute-spacing',
          data: {
            num: 0,
          },
        },
      ],
      output: `
        <template>
          <p v-foo="bar"></p>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p :foo=" bar"></p>
        </template>
      `,
      errors: [
        {
          messageId: 'vue-attribute-spacing',
          data: {
            num: 0,
          },
        },
      ],
      output: `
        <template>
          <p :foo="bar"></p>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p @foo=" bar"></p>
        </template>
      `,
      errors: [
        {
          messageId: 'vue-attribute-spacing',
          data: {
            num: 0,
          },
        },
      ],
      output: `
        <template>
          <p @foo="bar"></p>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p :foo="bar "></p>
        </template>
      `,
      errors: [
        {
          messageId: 'vue-attribute-spacing',
          data: {
            num: 0,
          },
        },
      ],
      output: `
        <template>
          <p :foo="bar"></p>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p v-foo="bar "></p>
        </template>
      `,
      options: ['always'],
      errors: [
        {
          messageId: 'vue-attribute-spacing',
          data: {
            num: 1,
          },
        },
      ],
      output: `
        <template>
          <p v-foo=" bar "></p>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p :foo="bar "></p>
        </template>
      `,
      options: ['always'],
      errors: [
        {
          messageId: 'vue-attribute-spacing',
          data: {
            num: 1,
          },
        },
      ],
      output: `
        <template>
          <p :foo=" bar "></p>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p @foo="bar "></p>
        </template>
      `,
      options: ['always'],
      errors: [
        {
          messageId: 'vue-attribute-spacing',
          data: {
            num: 1,
          },
        },
      ],
      output: `
        <template>
          <p @foo=" bar "></p>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p :foo=" bar"></p>
        </template>
      `,
      options: ['always'],
      errors: [
        {
          messageId: 'vue-attribute-spacing',
          data: {
            num: 1,
          },
        },
      ],
      output: `
        <template>
          <p :foo=" bar "></p>
        </template>
      `,
    },
  ],
})
