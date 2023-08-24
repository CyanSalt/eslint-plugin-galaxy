import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { getLiteralValue, isIdentifierOf } from '../estree'
import { createRule } from '../utils'

const MESSAGE_ID_PROTOTYPE = 'no-prototype-as-value.prototype'
const MESSAGE_ID_METHOD = 'no-prototype-as-value.method'
const MESSAGE_ID_SUGGESTION_LITERALS = 'suggestion@no-prototype-as-value.literals'

function getPropertyName(node: TSESTree.MemberExpression) {
  const property = node.property
  if (property.type === AST_NODE_TYPES.Identifier) {
    return property.name
  }
  return getLiteralValue(property)
}

const BUILTIN_IGNORES = [
  'Object.*',
  'Reflect.*',
  'jest.spyOn',
]

const WILDCARD_SYMBOL = Symbol('wildcard')

function isIgnoredByPath(node: TSESTree.Node, path: (string | typeof WILDCARD_SYMBOL)[]): boolean {
  if (!path.length) return true
  const objectPath = path.slice(0, -1)
  const propertyName = path[path.length - 1]
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    return isIgnoredByPath(node.object, objectPath) && (
      propertyName === WILDCARD_SYMBOL || getPropertyName(node) === propertyName
    )
  } else {
    return !objectPath.length && (
      propertyName === WILDCARD_SYMBOL || isIdentifierOf(node, propertyName)
    )
  }
}

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow using prototype of functions as values',
    },
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          ignores: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      [MESSAGE_ID_PROTOTYPE]: 'Unexpected use of "{{ object }}.prototype"',
      [MESSAGE_ID_METHOD]: 'Unexpected method call from "{{ object }}.prototype"',
      [MESSAGE_ID_SUGGESTION_LITERALS]: 'Use literals instead',
    },
  },
  defaultOptions: [
    { ignores: [] as string[] },
  ],
  create(context) {
    const code = context.getSourceCode()
    const ignores = context.options[0]?.ignores ?? []
    const ignoredPaths = [...BUILTIN_IGNORES, ...ignores].map(item => {
      return item.split('.').map(part => (part === '*' ? WILDCARD_SYMBOL : part))
    })

    function isIgnoredCallee(callee: TSESTree.LeftHandSideExpression) {
      return ignoredPaths.some(path => isIgnoredByPath(callee, path))
    }

    return {
      MemberExpression(node: TSESTree.MemberExpression) {
        const name = getPropertyName(node)
        if (name !== 'prototype') return
        let isUsedAsObject = false
        const parent = node.parent
        // Ignore `Function.prototype.foo`
        // but report `foo[Function.prototype]`
        if (
          parent.type === AST_NODE_TYPES.MemberExpression
          && node === parent.object
        ) {
          isUsedAsObject = true
          const upper = parent.parent
          // Ignore `Function.prototype.foo = bar`
          if (upper.type === AST_NODE_TYPES.AssignmentExpression && upper.left === parent) return
          // Ignore `const bar = Function.prototype.foo`
          if (
            upper.type === AST_NODE_TYPES.VariableDeclarator
            && upper.parent.type === AST_NODE_TYPES.VariableDeclaration
            && upper.parent.kind === 'const'
          ) return
          // Ignore `Function.prototype.foo.(apply|bind|call) only`
          if (
            upper.type === AST_NODE_TYPES.MemberExpression
            && (['call', 'apply', 'bind'] as unknown[]).includes(getPropertyName(upper))
          ) return
        }
        // Ignore `builtin_function(Function.prototype, ...rest)`
        if (
          parent.type === AST_NODE_TYPES.CallExpression
          && parent.arguments.includes(node)
          && isIgnoredCallee(parent.callee)
        ) return
        // Ignore `foo === Function.prototype`
        if (
          parent.type === AST_NODE_TYPES.BinaryExpression
          && ['==', '===', '!=', '!==', 'in', 'instanceof'].includes(parent.operator)
        ) return
        // Ignore `for (let foo in Function.prototype) {}`
        if (parent.type === AST_NODE_TYPES.ForInStatement) return
        // Ignore `switch (foo) { case Function.prototype: break }`
        if (parent.type === AST_NODE_TYPES.SwitchCase) return
        // Ignore `with (Function.prototype) {}`
        if (parent.type === AST_NODE_TYPES.WithStatement) return

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
                      return fixer.replaceText(node, `''`)
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
