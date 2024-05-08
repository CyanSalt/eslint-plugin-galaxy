import rule from '../../src/vue/vue-ref-style'
import { vueRuleTester } from '../tester'

vueRuleTester.run('vue-ref-style', rule, {
  valid: [
    {
      code: `
        <script lang="ts" setup>
        import { ref } from 'vue'

        let foo = ref()
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        let foo = $ref()
        </script>
      `,
    },
    {
      code: `
        <script lang="ts" setup>
        import { ref } from 'vue'

        let foo = ref()
        </script>
      `,
      options: ['ref'],
    },
    {
      code: `
        <script lang="ts" setup>
        let foo = $ref()
        </script>
      `,
      options: ['macro'],
    },
  ],
  invalid: [
    {
      code: `
        <script lang="ts" setup>
        import { ref } from 'vue'

        let foo = ref()
        let bar = $ref()
        </script>
      `,
      errors: [
        {
          messageId: 'vue-ref-style.mixed',
          suggestions: [
            {
              messageId: 'suggestion@vue-ref-style.callee',
              output: `
        <script lang="ts" setup>
        import { ref } from 'vue'

        let foo = $ref()
        let bar = $ref()
        </script>
      `,
            },
          ],
        },
        {
          messageId: 'vue-ref-style.mixed',
          suggestions: [
            {
              messageId: 'suggestion@vue-ref-style.callee',
              output: `
        <script lang="ts" setup>
        import { ref } from 'vue'

        let foo = ref()
        let bar = ref()
        </script>
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
        <script lang="ts" setup>
        let foo = $ref()
        </script>
      `,
      options: ['ref'],
      errors: [
        {
          messageId: 'vue-ref-style.ref',
          suggestions: [
            {
              messageId: 'suggestion@vue-ref-style.callee',
              output: `
        <script lang="ts" setup>
        let foo = ref()
        </script>
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
        <script lang="ts" setup>
        import { ref } from 'vue'

        let foo = ref()
        </script>
      `,
      options: ['macro'],
      errors: [
        {
          messageId: 'vue-ref-style.macro',
          suggestions: [
            {
              messageId: 'suggestion@vue-ref-style.callee',
              output: `
        <script lang="ts" setup>
        import { ref } from 'vue'

        let foo = $ref()
        </script>
      `,
            },
          ],
        },
      ],
    },
  ],
})
