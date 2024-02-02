import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, AST_TOKEN_TYPES } from '@typescript-eslint/utils'
import { getLiteralValue, isIdentifierOf } from '../estree'
import { removeElement } from '../fixer'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-duplicate-vue-store-mappings'

const MAPPING_FUNCTIONS = [
  'mapState',
  'mapWritableState',
  'mapGetters',
  'mapMutations',
  'mapActions',
]

type StoreMappingCallExpression = TSESTree.CallExpression & {
  callee: TSESTree.Identifier,
}

function getObjectSpreadSiblings(node: TSESTree.SpreadElement, direction = 0) {
  if (node.parent.type !== AST_NODE_TYPES.ObjectExpression) return []
  const spreadElements = node.parent.properties.filter((item): item is TSESTree.SpreadElement => {
    return item.type === AST_NODE_TYPES.SpreadElement
  })
  const index = spreadElements.indexOf(node)
  if (index === -1) return spreadElements
  return direction
    ? (direction < 0 ? spreadElements.slice(0, index) : spreadElements.slice(index))
    : spreadElements
}

function isMergableStoreMapping(
  source: TSESTree.CallExpression,
  target: StoreMappingCallExpression,
): source is StoreMappingCallExpression {
  if (
    !isIdentifierOf(source.callee, target.callee.name)
    || source.arguments.length !== target.arguments.length
  ) return false
  switch (target.arguments.length) {
    case 0:
      return true
    case 1:
      return target.arguments[0].type === source.arguments[0].type
    case 2: {
      if (target.arguments[1].type !== source.arguments[1].type) return false
      const targetNamespaceString = getLiteralValue(target.arguments[0])
      if (targetNamespaceString) {
        return targetNamespaceString === getLiteralValue(source.arguments[0])
      } else if (target.arguments[0].type === AST_NODE_TYPES.Identifier) {
        return isIdentifierOf(source.arguments[0], target.arguments[0].name)
      } else {
        return false
      }
    }
    default:
      return false
  }
}

function* mergeObjectLiteralExpression(
  code: TSESLint.SourceCode,
  fixer: TSESLint.RuleFixer,
  source: TSESTree.Node,
  target: TSESTree.Node,
) {
  if (target.type !== source.type) return
  switch (source.type) {
    case AST_NODE_TYPES.ObjectExpression: {
      const lastProperty = source.properties[source.properties.length - 1]
      const nextToken = code.getTokenAfter(lastProperty)
      const hasTrailingComma = nextToken?.type === AST_TOKEN_TYPES.Punctuator && nextToken.value === ','
      const hasLineFeed = code.getText(source).includes('\n')
      const separator = `,${hasLineFeed ? '\n' : ' '}`
      const properties = (target as typeof source).properties
      yield fixer.insertTextAfter(lastProperty, `${hasTrailingComma ? '' : separator}${properties.map(prop => code.getText(prop)).join(separator)}`)
      break
    }
    case AST_NODE_TYPES.ArrayExpression: {
      let nextToken: TSESTree.Token | null
      const lastElement = source.elements[source.elements.length - 1]
      if (lastElement) {
        nextToken = code.getTokenAfter(lastElement)
      } else {
        nextToken = code.getLastToken(source, {
          filter: token => token.type === AST_TOKEN_TYPES.Punctuator && token.value === ',',
        })!
      }
      const hasTrailingComma = nextToken?.type === AST_TOKEN_TYPES.Punctuator && nextToken.value === ','
      const hasLineFeed = code.getText(source).includes('\n')
      const separator = `,${hasLineFeed ? '\n' : ' '}`
      const elements = (target as typeof source).elements
      yield fixer.insertTextAfter(lastElement ?? nextToken!, `${hasTrailingComma ? '' : separator}${elements.map(element => (element ? code.getText(element) : '')).join(separator)}`)
      break
    }
    default:
      break
  }
}

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow duplicate store mapping functions in Vue components',
    },
    schema: [],
    fixable: 'code',
    messages: {
      [MESSAGE_ID_DEFAULT]: '"{{name}}" has been called on line {{line}}.',
    },
  },
  defaultOptions: [],
  create(context) {
    const code = context.getSourceCode()
    return {
      [`CallExpression:matches(${MAPPING_FUNCTIONS.map(name => `[callee.name="${name}"]`).join(', ')})`](node: StoreMappingCallExpression) {
        const parent = node.parent
        if (parent.type !== AST_NODE_TYPES.SpreadElement) return
        const previousSpreadSiblings = getObjectSpreadSiblings(parent, -1)
        const firstDuplicateSibling = previousSpreadSiblings.find((item): item is typeof item & {
          argument: StoreMappingCallExpression,
        } => {
          return item.argument.type === AST_NODE_TYPES.CallExpression
            && isMergableStoreMapping(item.argument, node)
        })
        if (firstDuplicateSibling) {
          const firstCall = firstDuplicateSibling.argument
          context.report({
            node: node.callee,
            messageId: MESSAGE_ID_DEFAULT,
            data: {
              name: node.callee.name,
              line: firstCall.loc.start.line,
            },
            *fix(fixer) {
              const mappingIndex = node.arguments.length - 1
              if (mappingIndex !== -1) {
                yield* mergeObjectLiteralExpression(
                  code,
                  fixer,
                  firstCall.arguments[mappingIndex],
                  node.arguments[mappingIndex],
                )
              }
              yield* removeElement(code, fixer, parent)
            },
          })
        }
      },
    }
  },
})
