import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'multi-branch-curly'

const NON_BLOCK_CONSEQUENT_SELECTOR = [
  `IfStatement[alternate]`,
  `:not([consequent.type="BlockStatement"])`,
].join('')

const NON_BLOCK_ALTERNATE_SELECTOR = [
  `IfStatement[alternate]`,
  `:not([alternate.type="BlockStatement"])`,
  `:not([alternate.type="IfStatement"])`,
].join('')

const NON_BLOCK_ALTERNATE_CONSEQUENT_SELECTOR = [
  `IfStatement[alternate.type="IfStatement"]`,
  `:not([alternate.consequent.type="BlockStatement"])`,
].join('')

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require following curly brace conventions for statements with multiple branches',
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Expected curly braces for statements with multiple branches',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      [NON_BLOCK_CONSEQUENT_SELECTOR]: (node: TSESTree.IfStatement & { alternate: TSESTree.Statement }) => {
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
      [NON_BLOCK_ALTERNATE_SELECTOR]: (node: TSESTree.IfStatement & { alternate: TSESTree.Statement }) => {
        const code = context.getSourceCode()
        const statement = node.alternate
        context.report({
          node: statement,
          messageId: MESSAGE_ID_DEFAULT,
          fix(fixer) {
            const source = code.getText(statement)
            return fixer.replaceText(statement, `{ ${source} }`)
          },
        })
      },
      [NON_BLOCK_ALTERNATE_CONSEQUENT_SELECTOR]: (node: TSESTree.IfStatement & { alternate: TSESTree.IfStatement }) => {
        const code = context.getSourceCode()
        const statement = node.alternate.consequent
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
