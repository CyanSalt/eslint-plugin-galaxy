import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-unknown-vue-options'

const communityOptions = [
  // vuex
  'store',
  // pinia
  'pinia',
  // vue-router
  'router',
  'beforeRouteEnter',
  'beforeRouteUpdate',
  'beforeRouteLeave',
  // vue-rx
  'subscriptions',
  'observableMethods',
  // @vue/compat
  'compatConfig',
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

/**
 * {@link https://vuejs.org/style-guide/rules-recommended.html#component-instance-options-order}
 */
const builtinOptions = [
  'name',
  'compilerOptions',
  'components',
  'directives',
  'extends',
  'mixins',
  'provide',
  'inject',
  'inheritAttrs',
  'props',
  'emits',
  'slots',
  'expose',
  'setup',
  'data',
  'computed',
  'watch',
  'beforeCreate',
  'created',
  'serverPrefetch',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'activated',
  'deactivated',
  'beforeUnmount',
  'unmounted',
  'errorCaptured',
  'renderTracked',
  'renderTriggered',
  'methods',
  'template',
  'render',
  // Vue 2 only
  'el',
  'parent',
  'functional',
  'delimiters',
  'comments',
  'filters',
  'model',
  'propsData',
  'beforeDestroy',
  'destroyed',
  'renderError',
]

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow unknown options in Vue components',
      recommended: 'recommended',
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
    { allows: [] } as { allows?: string[] } | undefined,
  ],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')
    const allowedOptions = [
      ...builtinOptions,
      ...communityOptions,
      ...context.options[0]?.allows ?? [],
    ]
    return utils.executeOnVue(context, (obj: TSESTree.ObjectExpression) => {
      for (const property of obj.properties) {
        if (property.type === AST_NODE_TYPES.Property) {
          const name: string = utils.getStaticPropertyName(property)
          if (!allowedOptions.includes(name)) {
            context.report({
              node: property,
              messageId: MESSAGE_ID_DEFAULT,
              data: {
                name,
              },
            })
          }
        }
      }
    })
  },
})
