import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'valid-indexof-return'
const MESSAGE_ID_SUGGESTION_INCLUDES = 'suggestion@valid-indexof-return.includes'

export default createRule({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow boolean cast of returning value of `.indexOf()`',
      recommended: 'error',
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Unexpected boolean cast of returning value of `.indexOf()`',
      [MESSAGE_ID_SUGGESTION_INCLUDES]: 'Use `.includes()` instead of `.indexOf()`',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      'CallExpression[callee.property.name="indexOf"]': (
        node: TSESTree.CallExpression & { callee: TSESTree.MemberExpression },
      ) => {
        if (!node.parent) return
        if (
          (node.parent.type === 'IfStatement' && node.parent.test === node)
          || (node.parent.type === 'ConditionalExpression' && node.parent.test === node)
          || (node.parent.type === 'LogicalExpression' && node.parent.left === node)
        ) {
          context.report({
            node,
            messageId: MESSAGE_ID_DEFAULT,
            suggest: [
              {
                messageId: MESSAGE_ID_SUGGESTION_INCLUDES,
                fix(fixer) {
                  return fixer.replaceText(node.callee.property, 'includes')
                },
              },
            ],
          })
        }
      },
    }
  },
})
