import type { TSESTree } from '@typescript-eslint/experimental-utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-for-in'

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow for-in statements',
      recommended: false,
    },
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Unexpected use of for-in statement.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ForInStatement: (node: TSESTree.ForInStatement) => {
        context.report({
          node,
          messageId: MESSAGE_ID_DEFAULT,
        })
      },
    }
  },
})
