import rule from '../../src/vue/no-duplicate-vue-uses'
import { ruleTester } from '../tester'

ruleTester.run('no-duplicate-vue-uses', rule, {
  valid: [
    {
      code: `
        import { useFoo } from '@foo/bar'

        const { foo } = useFoo()
      `,
      options: [
        { paths: ['@foo/**'] },
      ],
    },
    {
      code: `
        import { useFoo, useBar } from '@foo/bar'

        const { foo } = useFoo()
        const { bar } = useBar()
      `,
      options: [
        { paths: ['@foo/**'] },
      ],
    },
    {
      code: `
        import { useFoo } from '@foo/bar'

        const { foo } = useFoo()
        const { bar } = useFoo()
      `,
      options: [
        { paths: ['@bar/**'] },
      ],
    },
    {
      code: `
        import { useFoo } from '@foo/bar'

        const { foo } = $(useFoo())
        const { bar } = useFoo()
      `,
      options: [
        { paths: ['@bar/**'], ignoreDifferentUsages: true },
      ],
    },
  ],
  invalid: [
    {
      code: `
        import { useFoo } from '@foo/bar'

        const {
          foo,
        } = useFoo()
        let { bar } = useFoo()
      `,
      options: [
        { paths: ['@foo/**'] },
      ],
      errors: [
        {
          messageId: 'no-duplicate-vue-uses',
          data: {
            name: 'useFoo',
            line: 6,
          },
        },
      ],
      output: `
        import { useFoo } from '@foo/bar'

        let {
          foo,
bar,
        } = useFoo()
      `,
    },
    {
      code: `
        import { useFoo } from '@foo/bar'

        const foo = useFoo()
        let { bar } = useFoo()
      `,
      options: [
        { paths: ['@foo/**'] },
      ],
      errors: [
        {
          messageId: 'no-duplicate-vue-uses',
          data: {
            name: 'useFoo',
            line: 4,
          },
        },
      ],
      output: `
        import { useFoo } from '@foo/bar'

        const foo = useFoo()
        let { bar } = foo
      `,
    },
    {
      code: `
        import { useFoo } from '@foo/bar'

        const { foo } = $(useFoo())
        const { bar } = useFoo()
      `,
      options: [
        { paths: ['@foo/**'] },
      ],
      errors: [
        {
          messageId: 'no-duplicate-vue-uses',
          data: {
            name: 'useFoo',
            line: 4,
          },
        },
      ],
    },
  ],
})
