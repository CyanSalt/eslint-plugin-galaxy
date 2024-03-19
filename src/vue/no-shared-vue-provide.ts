import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-shared-vue-provide'

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce the `provide` option of Vue component to be a function',
      recommended: 'recommended',
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'The `provide` option of component must be a function',
    },
  },
  defaultOptions: [],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')
    const code = context.sourceCode
    return utils.executeOnVue(context, (obj: TSESTree.ObjectExpression) => {
      const provideProperty: TSESTree.Property | undefined = utils.findProperty(obj, 'provide')
      const functionOrIdentTypes = [
        AST_NODE_TYPES.FunctionExpression,
        AST_NODE_TYPES.ArrowFunctionExpression,
        AST_NODE_TYPES.Identifier,
      ]
      if (!provideProperty || functionOrIdentTypes.includes(provideProperty.value.type)) {
        return
      }
      context.report({
        node: provideProperty,
        messageId: MESSAGE_ID_DEFAULT,
        fix(fixer) {
          return [
            fixer.insertTextBefore(
              code.getFirstToken(provideProperty.value)!,
              'function () {\nreturn ',
            ),
            fixer.insertTextAfter(
              code.getLastToken(provideProperty.value)!,
              ';\n}',
            ),
          ]
        },
      })
    })
  },
})
