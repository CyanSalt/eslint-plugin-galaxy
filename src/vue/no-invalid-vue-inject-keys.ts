import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-invalid-vue-inject-keys'

const builtinOptions = [
  'from',
  'default',
]

export default createRule({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Require valid keys in Vue inject options',
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
      [MESSAGE_ID_DEFAULT]: 'Invalid key "{{name}}" in inject options',
    },
  },
  defaultOptions: [
    { allows: [] as string[] },
  ],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')
    const allowedOptions = [
      ...builtinOptions,
      ...context.options[0]?.allows ?? [],
    ]
    return utils.executeOnVue(context, (obj: TSESTree.ObjectExpression) => {
      const injectProperty: TSESTree.Property | undefined = utils.findProperty(obj, 'inject')
      if (!injectProperty || injectProperty.value.type !== AST_NODE_TYPES.ObjectExpression) {
        return
      }
      for (const item of injectProperty.value.properties) {
        if (item.type === AST_NODE_TYPES.Property && item.value.type === AST_NODE_TYPES.ObjectExpression) {
          for (const property of item.value.properties) {
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
      }
    })
  },
})
