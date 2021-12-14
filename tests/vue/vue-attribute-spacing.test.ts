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
        { message: 'Expected 0 space around the attribute.' } as any,
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
        { message: 'Expected 0 space around the attribute.' } as any,
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
        { message: 'Expected 0 space around the attribute.' } as any,
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
        { message: 'Expected 0 space around the attribute.' } as any,
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
        { message: 'Expected 1 space around the attribute.' } as any,
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
        { message: 'Expected 1 space around the attribute.' } as any,
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
        { message: 'Expected 1 space around the attribute.' } as any,
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
        { message: 'Expected 1 space around the attribute.' } as any,
      ],
      output: `
        <template>
          <p :foo=" bar "></p>
        </template>
      `,
    },
  ],
})
