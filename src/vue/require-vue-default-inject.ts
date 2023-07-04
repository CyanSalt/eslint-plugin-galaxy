import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { getLiteralValue } from '../estree'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'require-vue-default-inject'

const VUE_INJECT_WITHOUT_DEFAULTS = 'CallExpression[callee.name="inject"][arguments.length=1]'

function hasProperty(node: TSESTree.ObjectExpression, property: string) {
  return node.properties.some(prop => {
    return prop.type === AST_NODE_TYPES.Property && getLiteralValue(prop.key) === property
  })
}

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require default value for inject',
      recommended: 'error',
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Injection "{{name}}" requires default value to be set',
    },
  },
  defaultOptions: [],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')
    return utils.compositingVisitors(
      utils.defineVueVisitor(context, {
        onVueObjectEnter(node: TSESTree.ObjectExpression) {
          for (const injection of utils.iterateProperties(node, new Set(['inject']))) {
            if (
              injection.node.type !== AST_NODE_TYPES.ObjectExpression
              || !hasProperty(injection.node, 'default')
            ) {
              context.report({
                node,
                messageId: MESSAGE_ID_DEFAULT,
                data: {
                  name: injection.name,
                },
              })
            }
          }
        },
      }),
      {
        [VUE_INJECT_WITHOUT_DEFAULTS](node: TSESTree.CallExpression) {
          const code = context.getSourceCode()
          context.report({
            node,
            messageId: MESSAGE_ID_DEFAULT,
            data: {
              name: code.getText(node.arguments[0]),
            },
            fix(fixer) {
              const parent = node.parent
              if (parent?.type === AST_NODE_TYPES.LogicalExpression && parent.operator === '??') {
                return fixer.replaceText(
                  parent,
                  code.getText(node).replace(
                    /(?=\)$)/,
                    () => ', ' + code.getText(parent.right),
                  ),
                )
              }
              return null
            },
          })
        },
      },
    )
  },
})
