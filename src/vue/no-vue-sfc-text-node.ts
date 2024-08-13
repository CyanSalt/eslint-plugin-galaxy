import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../utils'

function getCommentRange(text: string) {
  let active: 'singleline' | 'multiline' | false = false
  let start = -1
  let end = -1
  const tokens = text.match(/(\/\/|\n|\/\*|\*\/)|[\s\S]+?(?=\/\/|\n|\/\*|\*\/|$)/g) ?? []
  let tokenStart = 0
  for (const token of tokens) {
    const tokenEnd = tokenStart + token.length
    switch (active) {
      case 'singleline':
        end = tokenEnd
        if (token === '\n') {
          active = false
        }
        break
      case 'multiline':
        end = tokenEnd
        if (token === '*/') {
          active = false
        }
        break
      default:
        if (token === '//') {
          active = 'singleline'
          if (start === -1) {
            start = tokenStart
          }
        } else if (token === '/*') {
          active = 'multiline'
          if (start === -1) {
            start = tokenStart
          }
        } else if (/\S/.test(token)) {
          return null
        }
        break
    }
    tokenStart = tokenEnd
  }
  if (active) return null
  return [start, end] as const
}

const MESSAGE_ID_DEFAULT = 'no-vue-sfc-text-node'

export default createRule({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow text nodes in Vue SFC files',
      recommended: 'recommended',
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Unexpected text node in Vue SFC.',
    },
  },
  defaultOptions: [],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')
    const code = context.sourceCode
    const documentFragment: {
      children: TSESTree.Node[],
    } | undefined = code.parserServices?.['getDocumentFragment']?.()
    return {
      Program(node) {
        if (utils.hasInvalidEOF(node)) return
        if (documentFragment) {
          const textNodes = documentFragment.children
            .filter((childNode): childNode is TSESTree.Node & { value: string } => {
              return childNode.type === 'VText' as never && Boolean(childNode['value'].trim())
            })
          for (const textNode of textNodes) {
            context.report({
              node: textNode,
              messageId: MESSAGE_ID_DEFAULT,
              fix(fixer) {
                const text = textNode.value
                const range = getCommentRange(text)
                if (range) {
                  return fixer.replaceText(textNode, `${text.slice(0, range[0])}<!-- ${text.slice(range[0], range[1])} -->${text.slice(range[1])}`)
                }
                return null
              },
            })
          }
        }
      },
    }
  },
})
