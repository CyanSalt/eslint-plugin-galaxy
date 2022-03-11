import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'vue-attribute-spacing'

function isAttributeQuote(token: TSESTree.Token | undefined) {
  return Boolean(token && token.type === 'Punctuator')
}

export default createRule({
  name: __filename,
  meta: {
    type: 'layout',
    docs: {
      description: 'Enforce unified spacing around binding attributes',
      recommended: false,
    },
    fixable: 'whitespace',
    schema: [
      {
        enum: ['always', 'never'],
      },
    ],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Expected {{ num }} space around the attribute.',
    },
  },
  defaultOptions: [
    'never',
  ],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')
    const option = context.options[0] || 'never'
    // @ts-expect-error eslint-plugin-vue API
    const template = context.parserServices!.getTemplateBodyTokenStore?.()
    return utils.defineTemplateBodyVisitor(context, {
      VExpressionContainer(node) {
        const openQuote = template.getFirstToken(node)
        const closeQuote = template.getLastToken(node)
        if (!isAttributeQuote(openQuote) || !isAttributeQuote(closeQuote)) {
          return
        }
        const firstToken = template.getTokenAfter(openQuote, {
          includeComments: true,
        })
        const lastToken = template.getTokenBefore(closeQuote, {
          includeComments: true,
        })

        if (option === 'always') {
          if (openQuote.range[1] === firstToken.range[0]) {
            context.report({
              node: openQuote,
              messageId: MESSAGE_ID_DEFAULT,
              data: { num: 1 },
              fix: (fixer) => fixer.insertTextAfter(openQuote, ' '),
            })
          }
          if (closeQuote.range[0] === lastToken.range[1]) {
            context.report({
              node: closeQuote,
              messageId: MESSAGE_ID_DEFAULT,
              data: { num: 1 },
              fix: (fixer) => fixer.insertTextBefore(closeQuote, ' '),
            })
          }
        } else {
          if (openQuote.range[1] !== firstToken.range[0]) {
            context.report({
              loc: {
                start: openQuote.loc.start,
                end: firstToken.loc.start,
              },
              messageId: MESSAGE_ID_DEFAULT,
              data: { num: 0 },
              fix: (fixer) =>
                fixer.removeRange([openQuote.range[1], firstToken.range[0]]),
            })
          }
          if (closeQuote.range[0] !== lastToken.range[1]) {
            context.report({
              loc: {
                start: lastToken.loc.end,
                end: closeQuote.loc.end,
              },
              messageId: MESSAGE_ID_DEFAULT,
              data: { num: 0 },
              fix: (fixer) =>
                fixer.removeRange([lastToken.range[1], closeQuote.range[0]]),
            })
          }
        }
      },
    })
  },
})
