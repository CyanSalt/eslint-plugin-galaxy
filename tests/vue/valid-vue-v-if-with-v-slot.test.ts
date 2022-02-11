/**
 * @jest-environment node
 */
import rule from '../../src/vue/valid-vue-v-if-with-v-slot'
import { vueRuleTester } from '../tester'

vueRuleTester.run('valid-vue-v-if-with-v-slot', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        <template>
          <Foo>
            <template v-if="abc" #bar></template>
          </Foo>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <Foo
            v-if="abc"
            v-slot="bar"
          />
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <Foo>
            <template v-if="abc" #default="bar"></template>
          </Foo>
        </template>
      `,
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        <template>
          <Foo>
            <template v-if="bar" #default="bar"></template>
          </Foo>
        </template>
      `,
      errors: [
        { message: '"bar" was used before it was defined.' } as any,
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <Foo>
            <template v-if="bar" #default="{ bar }"></template>
          </Foo>
        </template>
      `,
      errors: [
        { message: '"bar" was used before it was defined.' } as any,
      ],
    },
  ],
})
