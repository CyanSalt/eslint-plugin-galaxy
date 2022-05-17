import type { TSESTree, TSESLint } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { removeElement } from '../fixer'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-empty-vue-options'
const MESSAGE_ID_SUGGESTION_REMOVE = 'suggestion@no-empty-vue-options.remove'

function isEmpty(node: TSESTree.Node, source: TSESLint.SourceCode) {
  if (node.type === AST_NODE_TYPES.ObjectExpression) {
    return node.properties.length === 0
      && source.getCommentsInside(node).length === 0
  }
  if (node.type === AST_NODE_TYPES.ArrowFunctionExpression || node.type === AST_NODE_TYPES.FunctionExpression) {
    return node.body.type === AST_NODE_TYPES.BlockStatement
      && node.body.body.length === 0
      && source.getCommentsInside(node).length === 0
  }
  return false
}

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow using empty functions or objects as option values in Vue components',
      recommended: 'error',
    },
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          ignores: {
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
      [MESSAGE_ID_DEFAULT]: 'Empty option value',
      [MESSAGE_ID_SUGGESTION_REMOVE]: 'Remove empty option value',
    },
  },
  defaultOptions: [
    { ignores: [] as string[] },
  ],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')
    const ignoredOptions = context.options[0]?.ignores ?? []
    const code = context.getSourceCode()
    return utils.executeOnVue(context, (obj: TSESTree.ObjectExpression) => {
      for (const property of obj.properties) {
        const name: string = utils.getStaticPropertyName(property)
        if (
          property.type === AST_NODE_TYPES.Property
          && !ignoredOptions.includes(name)
          && isEmpty(property.value, code)
        ) {
          context.report({
            node: property,
            messageId: MESSAGE_ID_DEFAULT,
            suggest: [
              {
                messageId: MESSAGE_ID_SUGGESTION_REMOVE,
                fix(fixer) {
                  return removeElement(code, fixer, property)
                },
              },
            ],
          })
        }
      }
    })
  },
})
