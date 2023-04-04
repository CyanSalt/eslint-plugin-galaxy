import type { TSESTree, TSESLint } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_THIS = 'valid-vuex-properties.this'
const MESSAGE_ID_ARGUMENTS = 'valid-vuex-properties.arguments'

const MAPPING_FUNCTIONS = [
  'mapState',
  'mapGetters',
]

const PROPERTY_METHOD_SELECTOR = [
  `CallExpression:matches(${MAPPING_FUNCTIONS.map(name => `[callee.name="${name}"]`).join(', ')})`,
  '> ObjectExpression',
  '> Property',
  '> :matches(FunctionExpression, ArrowFunctionExpression)',
].join(' ')

function closest<T extends TSESTree.Node>(
  node: TSESTree.Node | undefined,
  filter: (node: TSESTree.Node) => node is T,
): T | undefined
function closest(
  node: TSESTree.Node | undefined,
  filter: (node: TSESTree.Node) => boolean,
): TSESTree.Node | undefined

function closest(
  node: TSESTree.Node | undefined,
  filter: (node: TSESTree.Node) => boolean,
): TSESTree.Node | undefined {
  if (!node || filter(node)) return node
  return closest(node.parent, filter)
}

function getClosestMappingFunctionCall(node: TSESTree.Node) {
  return closest(
    node,
    (item): item is TSESTree.CallExpression & { callee: TSESTree.Identifier } => {
      return item.type === AST_NODE_TYPES.CallExpression
        && item.callee.type === AST_NODE_TYPES.Identifier
        && MAPPING_FUNCTIONS.includes(item.callee.name)
    },
  )
}

function getDefinedVariable(scope: TSESLint.Scope.Scope, node: TSESTree.Node) {
  return scope.variables.find(variable => {
    return variable.defs.find(def => def.name === node)
  })
}

export default createRule({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce valid property mappings with Vuex',
      recommended: 'error',
    },
    schema: [],
    messages: {
      [MESSAGE_ID_THIS]: 'Disallow using "this" in "{{name}}".',
      [MESSAGE_ID_ARGUMENTS]: 'At least one argument must be used in "{{name}}".',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      [`${PROPERTY_METHOD_SELECTOR} ThisExpression`](node: TSESTree.ThisExpression) {
        const callNode = getClosestMappingFunctionCall(node)
        if (callNode) {
          context.report({
            node,
            messageId: MESSAGE_ID_THIS,
            data: {
              name: callNode.callee.name,
            },
          })
        }
      },
      [`${PROPERTY_METHOD_SELECTOR} > *`](node: TSESTree.BlockStatement | TSESTree.Expression) {
        const parent = node.parent as TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression
        if (parent.body !== node) return
        const callNode = getClosestMappingFunctionCall(node)
        if (callNode) {
          const scope = context.getScope()
          const hasArgumentReference = parent.params.some(param => {
            const variable = getDefinedVariable(scope, param)
            return Boolean(variable?.references.length)
          })
          if (!hasArgumentReference) {
            context.report({
              node,
              messageId: MESSAGE_ID_ARGUMENTS,
              data: {
                name: callNode.callee.name,
              },
            })
          }
        }
      },
    }
  },
})
