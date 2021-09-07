import type { TSESTree } from '@typescript-eslint/experimental-utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'valid-indexof-return'

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Best Practices',
      description: 'Disallow boolean cast of returning value of `.indexOf()`',
      recommended: 'error',
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Unexpected boolean cast of returning value of `.indexOf()`',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
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
