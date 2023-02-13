import { TSESLint } from '@typescript-eslint/utils'
import rule from '../../src/vue/vue-reactivity-transform-uses-vars'
import { vueRuleTester } from '../tester'

const noUnusedVarsRule = new TSESLint.Linter()
  .getRules()
  .get('no-unused-vars') as TSESLint.RuleModule<'unusedVar'>

vueRuleTester.defineRule('vue-reactivity-transform-uses-vars', rule)

vueRuleTester.run('no-unused-vars', noUnusedVarsRule, {
  valid: [
    {
      code: `
        <script setup>
        /* eslint vue-reactivity-transform-uses-vars: 'error' */
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
        /* eslint vue-reactivity-transform-uses-vars: 'error' */
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
        /* eslint vue-reactivity-transform-uses-vars: 'error' */
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
        /* eslint vue-reactivity-transform-uses-vars: 'error' */
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
        /* eslint vue-reactivity-transform-uses-vars: 'error' */
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
        <script>
        /* eslint vue-reactivity-transform-uses-vars: 'error' */
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
  ],
})
