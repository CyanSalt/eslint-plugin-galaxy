import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'non-control-statement-curly'

const NON_RETURN_STATEMENT_SELECTOR = [
  'IfStatement',
  ':not([consequent.type="BlockStatement"])',
  ':not([consequent.type="BreakStatement"])',
  ':not([consequent.type="ContinueStatement"])',
  ':not([consequent.type="ReturnStatement"])',
  ':not([consequent.type="ThrowStatement"])',
].join('')

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require following curly brace conventions for non-control statements',
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Expected curly braces for non-control statements',
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
