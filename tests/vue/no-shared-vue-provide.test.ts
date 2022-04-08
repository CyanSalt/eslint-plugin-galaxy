import rule from '../../src/vue/no-shared-vue-provide'
import { ruleTester } from '../tester'

ruleTester.run('no-shared-vue-provide', rule, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        export default {
          provide() {
            return {
              foo: 'bar',
            }
          },
        }
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          provide: () => ({
            foo: 'bar',
          }),
        }
      `,
    },
    {
      filename: 'test.vue',
      code: `
        export default {
          provide: foo,
        }
      `,
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        export default {
          provide: {
            foo: 'bar',
          },
        }
      `,
      errors: [
        { messageId: 'no-shared-vue-provide' },
      ],
      output: `
        export default {
          provide: function () {
return {
            foo: 'bar',
          };
},
        }
      `,
    },
  ],
})
