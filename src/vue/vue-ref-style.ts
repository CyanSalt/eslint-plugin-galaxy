import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { getModuleScope } from '../context'
import { createRule } from '../utils'
import { isReactivityTransformCall } from './vue-reactivity-transform-uses-vars'

const REF_FACTORY_IMPORT_SOURCES = [
  '@vue/reactivity',
  '@vue/runtime-core',
  '@vue/runtime-dom',
  'vue',
  '@vue/composition-api',
]

const REF_FACTORIES_ALL = [
  'ref',
  'shallowRef',
  'computed',
  'customRef',
  'toRef',
]

function getVueRefFactoryName(node: TSESTree.Identifier, scope: TSESLint.Scope.Scope) {
  if (scope.through.some(ref => ref.identifier === node)) return node.name
  for (const variable of scope.variables) {
    if (variable.name === node.name) {
      // unplugin-auto-import
      if (!variable.defs.length) return variable.name
      for (const def of variable.defs) {
        if (
          def.node.type === AST_NODE_TYPES.ImportSpecifier
          && def.node.parent.type === AST_NODE_TYPES.ImportDeclaration
          && REF_FACTORY_IMPORT_SOURCES.includes(def.node.parent.source.value)
        ) {
          return def.node.imported.name
        }
      }
    }
  }
  return undefined
}

function isRefFactoryCall(
  node: TSESTree.Expression,
  scope: TSESLint.Scope.Scope,
  factories: (string | undefined)[] = REF_FACTORIES_ALL,
): node is TSESTree.CallExpression & { callee: TSESTree.Identifier } {
  return node.type === AST_NODE_TYPES.CallExpression
    && node.callee.type === AST_NODE_TYPES.Identifier
    && factories.includes(getVueRefFactoryName(node.callee, scope))
}

const MESSAGE_ID_REF = 'vue-ref-style.ref'
const MESSAGE_ID_MACRO = 'vue-ref-style.macro'
const MESSAGE_ID_MIXED = 'vue-ref-style.mixed'
const MESSAGE_ID_SUGGESTION_CALLEE = 'suggestion@vue-ref-style.callee'

type MarkNonNullable<T, U extends keyof T> = Omit<T, U> & {
  [P in U]: NonNullable<T[P]>
}

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce Vue refs style',
    },
    hasSuggestions: true,
    schema: [
      {
        type: 'string',
        enum: ['ref', 'macro', 'consistent'],
      },
    ],
    messages: {
      [MESSAGE_ID_REF]: 'Use "{{name}}" instead of "${{name}}".',
      [MESSAGE_ID_MACRO]: 'Use "${{name}}" instead of "{{name}}".',
      [MESSAGE_ID_MIXED]: 'Expected to use consistent Vue refs.',
      [MESSAGE_ID_SUGGESTION_CALLEE]: 'Use "{{name}}" instead.',
    },
  },
  defaultOptions: [
    'consistent' as 'ref' | 'macro' | 'consistent',
  ],
  create(context) {
    const option = context.options[0] || 'consistent'
    let firstRefNode: TSESTree.CallExpression & { callee: TSESTree.Identifier } | undefined
    let firstMacroNode: TSESTree.CallExpression & { callee: TSESTree.Identifier } | undefined
    return {
      'VariableDeclarator[init]'(node: MarkNonNullable<TSESTree.VariableDeclarator, 'init'>) {
        const scope = getModuleScope(context)
        if (!scope) return
        if (isReactivityTransformCall(node.init, scope)) {
          if (option === 'ref') {
            const macroNode = node.init
            context.report({
              node: macroNode,
              messageId: MESSAGE_ID_REF,
              data: {
                name: macroNode.callee.name.slice(1),
              },
              suggest: [
                {
                  messageId: MESSAGE_ID_SUGGESTION_CALLEE,
                  data: {
                    name: macroNode.callee.name.slice(1),
                  },
                  fix(fixer) {
                    return fixer.replaceText(macroNode.callee, macroNode.callee.name.slice(1))
                  },
                },
              ],
            })
          } else if (option === 'consistent' && !firstMacroNode) {
            firstMacroNode = node.init
          }
        } else if (isRefFactoryCall(node.init, scope)) {
          if (option === 'macro') {
            const refNode = node.init
            context.report({
              node: refNode,
              messageId: MESSAGE_ID_MACRO,
              data: {
                name: refNode.callee.name,
              },
              suggest: [
                {
                  messageId: MESSAGE_ID_SUGGESTION_CALLEE,
                  data: {
                    name: '$' + refNode.callee.name,
                  },
                  fix(fixer) {
                    return fixer.replaceText(refNode.callee, '$' + refNode.callee.name)
                  },
                },
              ],
            })
          } else if (option === 'consistent' && !firstRefNode) {
            firstRefNode = node.init
          }
        }
      },
      'Program:exit'() {
        if (option === 'consistent' && firstRefNode && firstMacroNode) {
          context.report({
            node: firstMacroNode,
            messageId: MESSAGE_ID_MIXED,
            suggest: [
              {
                messageId: MESSAGE_ID_SUGGESTION_CALLEE,
                data: {
                  name: firstMacroNode.callee.name.slice(1),
                },
                fix(fixer) {
                  return fixer.replaceText(firstMacroNode!.callee, firstMacroNode!.callee.name.slice(1))
                },
              },
            ],
          })
          context.report({
            node: firstRefNode,
            messageId: MESSAGE_ID_MIXED,
            suggest: [
              {
                messageId: MESSAGE_ID_SUGGESTION_CALLEE,
                data: {
                  name: '$' + firstRefNode.callee.name,
                },
                fix(fixer) {
                  return fixer.replaceText(firstRefNode!.callee, '$' + firstRefNode!.callee.name)
                },
              },
            ],
          })
        }
      },
    }
  },
})
