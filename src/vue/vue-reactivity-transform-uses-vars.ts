import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { getModuleScope } from '../context'
import { createRule } from '../utils'

const vueMacroImportSources = [
  'vue/macros',
]

const macrosWithSideEffects = [
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
          && def.node.parent?.type === AST_NODE_TYPES.ImportDeclaration
          && vueMacroImportSources.includes(def.node.parent.source.value)
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
  macros?: (string | undefined)[],
) {
  return node.type === AST_NODE_TYPES.CallExpression
    && node.callee.type === AST_NODE_TYPES.Identifier
    && (
      macros
        ? macros.includes(getVueMacroName(node.callee, scope))
        : Boolean(getVueMacroName(node.callee, scope))
    )
}

export default createRule({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent variables used in reactivity transform to be marked as unused',
      recommended: false,
    },
    schema: [],
    messages: {},
  },
  defaultOptions: [],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')
    return {
      Program() {
        if (!utils.isScriptSetup(context)) return
        const scope = getModuleScope(context)
        if (!scope) return
        for (const variable of scope.variables) {
          for (const definition of variable.defs) {
            const node = definition.node
            if (
              node.type === AST_NODE_TYPES.VariableDeclarator
              && node.init
              && isReactivityTransformCall(node.init, scope, macrosWithSideEffects)
            ) {
              context.markVariableAsUsed(variable.name)
            }
          }
        }
      },
    }
  },
})
