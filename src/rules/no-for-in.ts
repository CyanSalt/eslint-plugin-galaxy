import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-for-in'
const MESSAGE_ID_SUGGESTION_FOR_OF_KEYS = 'suggestion@no-for-in.for-of-keys'

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow for-in statements',
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Unexpected use of for-in statement',
      [MESSAGE_ID_SUGGESTION_FOR_OF_KEYS]: 'Use for-of with `Object.keys()` instead',
    },
  },
  defaultOptions: [],
  create(context) {
    const code = context.getSourceCode()
    return {
      ForInStatement: (node: TSESTree.ForInStatement) => {
        context.report({
          node,
          messageId: MESSAGE_ID_DEFAULT,
          suggest: [
            {
              messageId: MESSAGE_ID_SUGGESTION_FOR_OF_KEYS,
              *fix(fixer) {
                const rightText = code.getText(node.right)
                yield fixer.replaceText(node.right, `Object.keys(${rightText})`)
                const operator = code.getTokenBefore(node.right)!
                yield fixer.replaceText(operator, 'of')
              },
            },
          ],
        })
      },
    }
  },
})
