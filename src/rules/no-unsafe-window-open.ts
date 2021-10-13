import type { TSESTree } from '@typescript-eslint/experimental-utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-unsafe-window-open'

const METHOD_SELECTOR = [
  `CallExpression`,
  `[callee.object.name="window"]`,
  `[callee.property.name="open"]`,
  `[arguments.length<=2]`,
].join('')

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow unsafe `window.open`',
      recommended: 'error',
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Call `window.open()` without the `noopener` feature is unsafe.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      [METHOD_SELECTOR]: (node: TSESTree.CallExpression) => {
        const code = context.getSourceCode()
        context.report({
          node,
          messageId: MESSAGE_ID_DEFAULT,
          fix(fixer) {
            const argumentsSource = node.arguments.map(argument => code.getText(argument))
            const argumentsText = argumentsSource.concat(
              ['', `'_blank'`, `'noopener'`].slice(argumentsSource.length),
            ).join(', ')
            if (node.parent?.type === 'ExpressionStatement') {
              return fixer.replaceText(node, `window.open(${argumentsText})`)
            }
            return null
          },
        })
      },
    }
  },
})
