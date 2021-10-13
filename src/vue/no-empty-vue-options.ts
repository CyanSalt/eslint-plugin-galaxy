import type { TSESTree, TSESLint } from '@typescript-eslint/experimental-utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-empty-vue-options'

function isEmpty(node: TSESTree.Node, source: TSESLint.SourceCode) {
  if (node.type === 'ObjectExpression') {
    return node.properties.length === 0
      && source.getCommentsInside(node).length === 0
  }
  if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
    return node.body.type === 'BlockStatement'
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
    },
  },
  defaultOptions: [
    { ignores: [] as string[] },
  ],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const ignoredOptions = context.options[0]?.ignores ?? []
    const source = context.getSourceCode()
    return utils.executeOnVue(context, (obj: TSESTree.ObjectExpression) => {
      for (const property of obj.properties) {
        const name: string | null = utils.getStaticPropertyName(property)
        if (
          property.type === 'Property'
          && name
          && !ignoredOptions.includes(name)
          && isEmpty(property.value, source)
        ) {
          context.report({
            node: property,
            messageId: MESSAGE_ID_DEFAULT,
          })
        }
      }
    })
  },
})
