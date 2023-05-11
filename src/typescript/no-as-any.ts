import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-as-any'

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow `any` type assertions',
      recommended: false,
    },
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Type assertions to "any" are not allowed',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      'TSAsExpression TSAnyKeyword:not(TSTypeReference TSAnyKeyword)': (node: TSESTree.TSAnyKeyword) => {
        context.report({
          node,
          messageId: MESSAGE_ID_DEFAULT,
        })
      },
    }
  },
})
