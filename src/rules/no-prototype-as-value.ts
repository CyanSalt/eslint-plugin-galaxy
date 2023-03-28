import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'
import { isIdentifierOf, isMemberExpressionOf } from '../estree'
import { createRule } from '../utils'

const MESSAGE_ID_PROTOTYPE = 'no-prototype-as-value.prototype'
const MESSAGE_ID_METHOD = 'no-prototype-as-value.method'
const MESSAGE_ID_SUGGESTION_LITERALS = 'suggestion@no-prototype-as-value.literals'

function getPropertyName(node: TSESTree.MemberExpression) {
  const property = node.property
  if (property.type === AST_NODE_TYPES.Identifier) {
    return property.name
  }
  if (property.type === AST_NODE_TYPES.Literal) {
    return property.value
  }
  if (property.type === AST_NODE_TYPES.TemplateLiteral && property.quasis.length === 1) {
    return property.quasis[0].value.cooked
  }
  return undefined
}

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow using prototype of functions as values',
      recommended: 'error',
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      [MESSAGE_ID_PROTOTYPE]: 'Unexpected use of "{{ object }}.prototype"',
      [MESSAGE_ID_METHOD]: 'Unexpected method call from "{{ object }}.prototype"',
      [MESSAGE_ID_SUGGESTION_LITERALS]: 'Use literals instead',
    },
  },
  defaultOptions: [],
  create(context) {
    const code = context.getSourceCode()
    return {
      MemberExpression(node: TSESTree.MemberExpression) {
        const name = getPropertyName(node)
        if (name !== 'prototype') return
        let isUsedAsObject = false
        const parent = node.parent
        // Ignore `Function.prototype.foo`
        // but report `foo[Function.prototype]`
        if (
          parent?.type === AST_NODE_TYPES.MemberExpression
          && node === parent.object
        ) {
          isUsedAsObject = true
          // Ignore `Function.prototype.foo.(apply|bind|call) only`
          const upper = parent.parent
          if (
            upper?.type === AST_NODE_TYPES.MemberExpression
            && (
              isIdentifierOf(upper.property, 'call')
              || isIdentifierOf(upper.property, 'apply')
              || isIdentifierOf(upper.property, 'bind')
            )
          ) return
        }
        // Ignore `builtin_function(Function.prototype, ...rest)`
        if (
          parent?.type === AST_NODE_TYPES.CallExpression
          && parent.arguments.includes(node)
          && (
            isMemberExpressionOf(parent.callee, 'Object')
            || isMemberExpressionOf(parent.callee, 'Reflect')
            || isMemberExpressionOf(parent.callee, 'jest', 'spyOn')
          )
        ) return
        // Ignore `foo === Function.prototype`
        if (
          parent?.type === AST_NODE_TYPES.BinaryExpression
          && ['==', '===', '!=', '!==', 'in', 'instanceof'].includes(parent.operator)
        ) return
        // Ignore `for (let foo in Function.prototype) {}`
        if (parent?.type === AST_NODE_TYPES.ForInStatement) return
        // Ignore `switch (foo) { case Function.prototype: break }`
        if (parent?.type === AST_NODE_TYPES.SwitchCase) return
        // Ignore `with (Function.prototype) {}`
        if (parent?.type === AST_NODE_TYPES.WithStatement) return

        const object = code.getText(node.object)
        if (isUsedAsObject) {
          context.report({
            node,
            messageId: MESSAGE_ID_METHOD,
            data: {
              object,
            },
          })
        } else {
          context.report({
            node,
            messageId: MESSAGE_ID_PROTOTYPE,
            data: {
              object,
            },
            suggest: [
              {
                messageId: MESSAGE_ID_SUGGESTION_LITERALS,
                fix(fixer) {
                  switch (object) {
                    case 'Number':
                      return fixer.replaceText(node, '0')
                    case 'String':
                      return fixer.replaceText(node, '')
                    case 'Boolean':
                      return fixer.replaceText(node, 'false')
                    case 'Object':
                      return fixer.replaceText(node, '{}')
                    case 'Function':
                      return fixer.replaceText(node, '() => {}')
                    case 'Array':
                      return fixer.replaceText(node, '[]')
                    case 'RegExp':
                      return fixer.replaceText(node, '/(?:)/')
                    default:
                      return null
                  }
                },
              },
            ],
          })
        }
      },
    }
  },
})
