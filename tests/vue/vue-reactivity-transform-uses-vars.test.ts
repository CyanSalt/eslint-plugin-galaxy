import type { TSESLint } from '@typescript-eslint/utils'
import { builtinRules } from 'eslint/use-at-your-own-risk'
import vueEslintParser from 'vue-eslint-parser'
import rule from '../../src/vue/vue-reactivity-transform-uses-vars'
import { RuleTester } from '../tester'

const vueRuleTester = new RuleTester({
  languageOptions: {
    parser: vueEslintParser,
    parserOptions: {
      parser: {
        ts: require.resolve('@typescript-eslint/parser'),
      },
    },
  },
  plugins: {
    galaxy: {
      rules: {
        'vue-reactivity-transform-uses-vars': rule,
      },
    },
  },
})

const noUnusedVarsRule = builtinRules.get('no-unused-vars')! as unknown as TSESLint.RuleModule<'unusedVar'>

vueRuleTester.run('no-unused-vars', noUnusedVarsRule, {
  valid: [
    {
      code: `
        <script setup>
        /* eslint galaxy/vue-reactivity-transform-uses-vars: 'error' */
        let foo = $(useFoo())
        onMounted(() => {
          foo = 1
        })
        </script>
      `,
    },
    {
      code: `
        <script setup>
        /* global $ */
        /* eslint galaxy/vue-reactivity-transform-uses-vars: 'error' */
        let foo = $(useFoo())
        onMounted(() => {
          foo = 1
        })
        </script>
      `,
    },
    {
      code: `
        <script setup>
        import { $ } from 'vue/macros'
        /* eslint galaxy/vue-reactivity-transform-uses-vars: 'error' */
        let foo = $(useFoo())
        onMounted(() => {
          foo = 1
        })
        </script>
      `,
    },
    {
      code: `
        <script setup>
        import { $ as _$ } from 'vue/macros'
        /* eslint galaxy/vue-reactivity-transform-uses-vars: 'error' */
        let foo = _$(useFoo())
        onMounted(() => {
          foo = 1
        })
        </script>
      `,
    },
    {
      code: `
        <script setup>
        /* eslint galaxy/vue-reactivity-transform-uses-vars: 'error' */
        let { foo } = $(useFoo())
        onMounted(() => {
          foo = 1
        })
        </script>
      `,
    },
    {
      code: `
        <script setup>
        /* eslint galaxy/vue-reactivity-transform-uses-vars: 'error' */
        let foo = $(useFoo())
        onMounted(() => {
          foo = 1
        })
        </script>
        <script>
        export default {}
        </script>
      `,
    },
  ],
  invalid: [
    {
      code: `
        <script setup>
        let foo = $(useFoo())
        </script>
      `,
      errors: [
        {
          messageId: 'unusedVar',
          data: {
            varName: 'foo',
            action: 'assigned a value',
            additional: '',
          },
        },
      ],
    },
    {
      code: `
        <script setup>
        let foo = $(useFoo())
        onMounted(() => {
          foo = 1
        })
        </script>
      `,
      errors: [
        {
          messageId: 'unusedVar',
          data: {
            varName: 'foo',
            action: 'assigned a value',
            additional: '',
          },
        },
      ],
    },
    {
      code: `
        <script setup>
        /* eslint galaxy/vue-reactivity-transform-uses-vars: 'error' */
        let foo = $(useFoo())
        let bar = $computed(() => foo)
        </script>
      `,
      errors: [
        {
          messageId: 'unusedVar',
          data: {
            varName: 'bar',
            action: 'assigned a value',
            additional: '',
          },
        },
      ],
    },
  ],
})
