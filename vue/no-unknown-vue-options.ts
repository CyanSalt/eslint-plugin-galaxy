import type { TSESTree } from '@typescript-eslint/experimental-utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-unknown-vue-options'

const communityOptions = [
  // vuex
  'store',
  // vue-router
  'router',
  'beforeRouteEnter',
  'beforeRouteUpdate',
  'beforeRouteLeave',
  // nuxt
  'key',
  'layout',
  'middleware',
  'validate',
  'scrollToTop',
  'transition',
  'loading',
  'asyncData',
  'fetch',
  'head',
  'watchQuery',
  // vue-apollo
  'apolloProvider',
  'apollo',
]

const builtinOptions = [
  'el',
  'name',
  'parent',
  'functional',
  'delimiters',
  'comments',
  'components',
  'directives',
  'filters',
  'extends',
  'mixins',
  'provide',
  'inject',
  'inheritAttrs',
  'model',
  'props',
  'propsData',
  'emits',
  'setup',
  'data',
  'computed',
  'watch',
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'activated',
  'deactivated',
  'beforeUnmount',
  'unmounted',
  'beforeDestroy',
  'destroyed',
  'renderTracked',
  'renderTriggered',
  'errorCaptured',
  'methods',
  'template',
  'render',
  'renderError',
]

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Possible Errors',
      description: 'Disallow unknown options in Vue SFC',
      recommended: 'error',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allows: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Unknown option: "{{name}}"',
    },
  },
  defaultOptions: [
    { allows: [] as string[] },
  ],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')
    const allowedOptions = [
      ...builtinOptions,
      ...communityOptions,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      ...context.options[0]?.allows ?? [],
    ]
    return utils.executeOnVue(context, (obj: TSESTree.ObjectExpression) => {
      for (const property of obj.properties) {
        const name: string | null = utils.getStaticPropertyName(property)
        if (property.type === 'Property' && name && !allowedOptions.includes(name)) {
          context.report({
            node: property,
            messageId: MESSAGE_ID_DEFAULT,
            data: {
              name,
            },
          })
        }
      }
    })
  },
})
