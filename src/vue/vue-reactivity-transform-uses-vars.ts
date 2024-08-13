import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { getModuleScope } from '../context'
import { createRule } from '../utils'

const MACRO_IMPORT_SOURCES = [
  'vue/macros',
]

const MACROS_ALL = [
  '$',
  // '$$',
  '$ref',
  '$shallowRef',
  '$computed',
  '$customRef',
  '$toRef',
]

const MACROS_WITH_SIDE_EFFECTS = [
  '$',
  '$computed',
  '$customRef',
  '$toRef',
]

function getVueMacroName(node: TSESTree.Identifier, scope: TSESLint.Scope.Scope) {
  if (scope.through.some(ref => ref.identifier === node)) return node.name
  for (const variable of scope.variables) {
    if (variable.name === node.name) {
      if (!variable.defs.length) return variable.name
      for (const def of variable.defs) {
        if (
          def.node.type === AST_NODE_TYPES.ImportSpecifier
          && def.node.parent.type === AST_NODE_TYPES.ImportDeclaration
          && MACRO_IMPORT_SOURCES.includes(def.node.parent.source.value)
        ) {
          return def.node.imported.name
        }
      }
    }
  }
  return undefined
}

export function isReactivityTransformCall(
  node: TSESTree.Expression,
  scope: TSESLint.Scope.Scope,
  macros: (string | undefined)[] = MACROS_ALL,
): node is TSESTree.CallExpression & { callee: TSESTree.Identifier } {
  return node.type === AST_NODE_TYPES.CallExpression
    && node.callee.type === AST_NODE_TYPES.Identifier
    && macros.includes(getVueMacroName(node.callee, scope))
}

function isAssignmentReference(ref: TSESLint.Scope.Reference) {
  return Boolean(ref.writeExpr && !ref.init)
}

export default createRule({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent variables used in reactivity transform to be marked as unused',
    },
    schema: [],
    messages: {},
  },
  defaultOptions: [],
  create(context) {
    return {
      Program() {
        const scope = getModuleScope(context)
        if (!scope) return
        for (const variable of scope.variables) {
          for (const definition of variable.defs) {
            const node = definition.node
            if (
              node.type === AST_NODE_TYPES.VariableDeclarator
              && node.init
              && isReactivityTransformCall(node.init, scope, MACROS_WITH_SIDE_EFFECTS)
              && variable.references.some(isAssignmentReference)
            ) {
              context.sourceCode.markVariableAsUsed(variable.name, scope.block)
            }
          }
        }
      },
    }
  },
})
