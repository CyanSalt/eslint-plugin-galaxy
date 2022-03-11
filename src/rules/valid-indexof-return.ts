import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'valid-indexof-return'

export default createRule({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow boolean cast of returning value of `.indexOf()`',
      recommended: 'error',
    },
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Unexpected boolean cast of returning value of `.indexOf()`',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      'CallExpression[callee.property.name="indexOf"]': (node: TSESTree.CallExpression) => {
        if (!node.parent) return
        if (
          (node.parent.type === 'IfStatement' && node.parent.test === node)
          || (node.parent.type === 'ConditionalExpression' && node.parent.test === node)
          || (node.parent.type === 'LogicalExpression' && node.parent.left === node)
        ) {
          context.report({
            node,
            messageId: MESSAGE_ID_DEFAULT,
          })
        }
      },
    }
  },
})
