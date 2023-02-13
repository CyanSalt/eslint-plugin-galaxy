import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
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

function isGlobalOrVueMacro(node: TSESTree.Identifier, scope: TSESLint.Scope.Scope) {
  if (scope.through.some(ref => ref.identifier === node)) return true
  return scope.variables.some(variable => {
    return variable.name === node.name && (
      !variable.defs.length || variable.defs.some(def => {
        return def.node.type === AST_NODE_TYPES.ImportSpecifier
          && def.node.parent?.type === AST_NODE_TYPES.ImportDeclaration
          && vueMacroImportSources.includes(def.node.parent.source.value)
      })
    )
  })
}

function isWritableReactivityTransformCall(node: TSESTree.Expression, scope: TSESLint.Scope.Scope) {
  return node.type === AST_NODE_TYPES.CallExpression
    && node.callee.type === AST_NODE_TYPES.Identifier
    && macrosWithSideEffects.includes(node.callee.name)
    && isGlobalOrVueMacro(node.callee, scope)
}

export default createRule({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent variables used in reactivity transform to be marked as unused',
      recommended: 'error',
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
        const scope = context.getScope().childScopes
          .find(item => item.type === 'module')
        if (!scope) return
        for (const variable of scope.variables) {
          for (const definition of variable.defs) {
            const node = definition.node
            if (
              node.type === AST_NODE_TYPES.VariableDeclarator
              && node.init
              && isWritableReactivityTransformCall(node.init, scope)
            ) {
              context.markVariableAsUsed(variable.name)
            }
          }
        }
      },
    }
  },
})
