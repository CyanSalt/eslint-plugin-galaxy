import rule from '../../src/rules/no-unnecessary-optional-chain'
import { ruleTester, vueRuleTester } from '../tester'

ruleTester.run('no-unnecessary-optional-chain', rule, {
  valid: [
    {
      code: `foo?.bar`,
    },
    {
      code: `foo?.bar?.[0]`,
    },
    {
      code: `if (foo?.bar) { bar = foo.bar }`,
    },
    {
      code: `foo?.bar ? foo.bar() : foo.baz`,
    },
    {
      code: `foo?.[qux] && baz(foo[qux])`,
    },
    {
      code: `foo.bar?.baz > foo.bar?.qux`,
    },
  ],
  invalid: [
    {
      code: `[foo]?.bar`,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.literal' },
      ],
      output: `[foo].bar`,
    },
    {
      code: `new Foo()?.bar`,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.literal' },
      ],
      output: `new Foo().bar`,
    },
    {
      code: `if (foo?.bar) { bar = foo?.bar }`,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.non-nullable' },
      ],
      output: `if (foo?.bar) { bar = foo.bar }`,
    },
    {
      code: `foo.bar ? foo.bar?.() : foo.baz`,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.non-nullable' },
      ],
      output: `foo.bar ? foo.bar() : foo.baz`,
    },
    {
      code: `foo?.[qux] && baz(foo?.[qux])`,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.non-nullable' },
      ],
      output: 'foo?.[qux] && baz(foo[qux])',
    },
    {
      code: `foo.bar.baz > foo.bar?.qux`,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.non-nullable' },
      ],
      output: 'foo.bar.baz > foo.bar.qux',
    },
    {
      code: `foo.bar?.baz > foo.bar.qux`,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.non-nullable' },
      ],
      output: 'foo.bar.baz > foo.bar.qux',
    },
  ],
})

vueRuleTester.run('no-unnecessary-optional-chain', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        <template>
          <p>{{ foo?.bar }}</p>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p v-if="foo?.bar">{{ foo.bar }}</p>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p v-if="foo?.bar" :aria-label="foo.bar()"></p>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p v-if="foo?.bar">
            <span @click="foo.bar()"></span>
          </p>
        </template>
      `,
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        <template>
          <p>{{ [foo]?.bar }}</p>
        </template>
      `,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.literal' },
      ],
      output: `
        <template>
          <p>{{ [foo].bar }}</p>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <script setup>
        let value = new Foo()?.bar
        </script>
        <template>
          <p>{{ value }}</p>
        </template>
      `,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.literal' },
      ],
      output: `
        <script setup>
        let value = new Foo().bar
        </script>
        <template>
          <p>{{ value }}</p>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p v-if="foo?.bar">{{ foo?.bar }}</p>
        </template>
      `,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.non-nullable' },
      ],
      output: `
        <template>
          <p v-if="foo?.bar">{{ foo.bar }}</p>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p v-if="foo.bar" :aria-label="foo.bar?.()"></p>
        </template>
      `,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.non-nullable' },
      ],
      output: `
        <template>
          <p v-if="foo.bar" :aria-label="foo.bar()"></p>
        </template>
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <template>
          <p v-if="foo?.[qux]">
            <span @click="baz(foo?.[qux])"></span>
          </p>
        </template>
      `,
      errors: [
        { messageId: 'no-unnecessary-optional-chain.non-nullable' },
      ],
      output: `
        <template>
          <p v-if="foo?.[qux]">
            <span @click="baz(foo[qux])"></span>
          </p>
        </template>
      `,
    },
  ],
})
