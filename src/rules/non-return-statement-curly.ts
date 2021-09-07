import type { TSESTree } from '@typescript-eslint/experimental-utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'non-return-statement-curly'

const NON_RETURN_STATEMENT_SELECTOR = [
  'IfStatement',
  ':not(',
  '[consequent.type="BlockStatement"]',
  ',',
  '[consequent.type="ReturnStatement"]',
  ')',
].join('')

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Stylistic Issues',
      description: 'Require following curly brace conventions for non-return statements',
      recommended: false,
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Expected curly braces for non-return statements',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      [NON_RETURN_STATEMENT_SELECTOR]: (node: TSESTree.IfStatement) => {
        const code = context.getSourceCode()
        const statement = node.consequent
        context.report({
          node: statement,
          messageId: MESSAGE_ID_DEFAULT,
          fix(fixer) {
            const source = code.getText(statement)
            return fixer.replaceText(statement, `{ ${source} }`)
          },
        })
      },
    }
  },
})
