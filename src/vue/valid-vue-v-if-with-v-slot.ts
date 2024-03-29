import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'valid-vue-v-if-with-v-slot'

export default createRule({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce valid `v-if` directives when using with `v-slot`',
      recommended: 'recommended',
    },
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: '"{{name}}" was used before it was defined.',
    },
  },
  defaultOptions: [],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')
    return utils.defineTemplateBodyVisitor(context, {
      'VAttribute[directive=true][key.name.name="if"]'(node) {
        const startTag = node.parent
        const templateElement = startTag.parent
        const references = node.value.references
        const variables = references
          .filter(item => item.id.type === AST_NODE_TYPES.Identifier)
        for (const variable of variables) {
          if (variable.id.type === AST_NODE_TYPES.Identifier) {
            const definition = templateElement.variables.find(
              item => item.id.type === AST_NODE_TYPES.Identifier && item.id.name === variable.id.name,
            )
            if (definition && definition.kind === 'scope') {
              context.report({
                loc: variable.id.loc,
                messageId: MESSAGE_ID_DEFAULT,
                data: {
                  name: variable.id.name,
                },
              })
            }
          }
        }
      },
    })
  },
})
