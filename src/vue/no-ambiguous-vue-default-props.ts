import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { getRealExpression, isIdentifierOf, isIdentifierProperty, isObjectDestructure } from '../estree'
import { removeElement } from '../fixer'
import { createRule } from '../utils'

function getProperty(expr: TSESTree.ObjectExpression, name: string) {
  return expr.properties.find((item): item is TSESTree.Property => {
    return item.type === AST_NODE_TYPES.Property
      && isIdentifierOf(item.key, name)
  })
}

function isEmptyArrowFunction(node: TSESTree.Node): node is TSESTree.ArrowFunctionExpression {
  return node.type === AST_NODE_TYPES.ArrowFunctionExpression
    && node.body.type === AST_NODE_TYPES.BlockStatement
    && !node.body.body.length
}

function isVueObjectType(prop: any) {
  if (prop.type === 'type') {
    return prop.types?.length === 1 && prop.types.includes('Object')
  } else {
    const expr = getRealExpression(prop.value)
    return isIdentifierOf(expr, 'Object')
  }
}

const MESSAGE_ID_DEFAULT = 'no-ambiguous-vue-default-props'

export default createRule({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow using empty functions as default values of Vue props',
      recommended: false,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          fixStyle: {
            enum: ['remove', 'match-type', 'none'],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'The default value for prop should not return undefined.',
    },
  },
  defaultOptions: [
    { fixStyle: 'none' as 'remove' | 'match-type' | 'none' },
  ],
  create(context) {
    const fixStyle = context.options[0]?.fixStyle ?? 'none'
    const code = context.getSourceCode()
    const utils = require('eslint-plugin-vue/lib/utils')
    return utils.compositingVisitors(
      // { default: () => {} }
      utils.defineVueVisitor(context, {
        onVueObjectEnter(node: TSESTree.ObjectExpression) {
          const propsProperty = node.properties.find((prop): prop is TSESTree.Property & {
            value: TSESTree.ObjectExpression,
          } => {
            return prop.type === AST_NODE_TYPES.Property
              && isIdentifierOf(prop.key, 'props')
              && prop.value.type === AST_NODE_TYPES.ObjectExpression
          })
          if (propsProperty) {
            const props = propsProperty.value.properties.filter((prop): prop is TSESTree.Property & {
              value: TSESTree.ObjectExpression,
            } => {
              return prop.type === AST_NODE_TYPES.Property
                && prop.value.type === AST_NODE_TYPES.ObjectExpression
            })
            for (const prop of props) {
              const decl = prop.value
              const defaultProperty = getProperty(decl, 'default')
              const defaultValue = defaultProperty ? getRealExpression(defaultProperty.value) : undefined
              if (defaultValue && isEmptyArrowFunction(defaultValue)) {
                const typeProperty = getProperty(decl, 'type')
                const type = typeProperty ? getRealExpression(typeProperty.value) : undefined
                if (type && isIdentifierOf(type, 'Object')) {
                  context.report({
                    node: defaultValue,
                    messageId: MESSAGE_ID_DEFAULT,
                    *fix(fixer) {
                      switch (fixStyle) {
                        case 'remove':
                          yield* removeElement(code, fixer, defaultProperty!)
                          break
                        case 'match-type':
                          yield fixer.insertTextBefore(defaultValue.body, '(')
                          yield fixer.insertTextAfter(defaultValue.body, ')')
                          break
                        default:
                          return null
                      }
                    },
                  })
                }
              }
            }
          }
        },
      }),
      utils.defineScriptSetupVisitor(context, {
        onDefinePropsEnter(node: TSESTree.CallExpression, baseProps: any[]) {
          // withDefaults(props, { foo: () => {} })
          const defaults = utils.getWithDefaultsProps(node)
          for (const [key, property] of Object.entries<TSESTree.Property>(defaults)) {
            const defaultValue = getRealExpression(property.value)
            if (isEmptyArrowFunction(defaultValue)) {
              const type = baseProps.find(prop => prop.propName === key)
              if (type && isVueObjectType(type)) {
                context.report({
                  node: defaultValue,
                  messageId: MESSAGE_ID_DEFAULT,
                  *fix(fixer) {
                    switch (fixStyle) {
                      case 'remove':
                        yield* removeElement(code, fixer, property)
                        break
                      case 'match-type':
                        yield fixer.insertTextBefore(defaultValue.body, '(')
                        yield fixer.insertTextAfter(defaultValue.body, ')')
                        break
                      default:
                        return null
                    }
                  },
                })
              }
            }
          }
          // const { foo: (() => {}) as never } = defineProps()
          // const { foo: () => {} } = defineProps()
          if (node.parent && isObjectDestructure(node.parent)) {
            const pattern = node.parent.id
            const declarationProperties = pattern.properties.filter(isIdentifierProperty)
            for (const decl of declarationProperties) {
              if (decl.value.type === AST_NODE_TYPES.AssignmentPattern) {
                const assignment = decl.value
                const defaultValue = getRealExpression(assignment.right)
                if (isEmptyArrowFunction(defaultValue)) {
                  const type = baseProps.find(prop => prop.propName === decl.key.name)
                  if (type && isVueObjectType(type)) {
                    context.report({
                      node: defaultValue,
                      messageId: MESSAGE_ID_DEFAULT,
                      *fix(fixer) {
                        switch (fixStyle) {
                          case 'remove':
                            yield fixer.replaceText(assignment, code.getText(assignment.left))
                            break
                          case 'match-type':
                            yield fixer.insertTextBefore(defaultValue.body, '(')
                            yield fixer.insertTextAfter(defaultValue.body, ')')
                            break
                          default:
                            return null
                        }
                      },
                    })
                  }
                }
              }
            }
          }
        },
      }),
    )
  },
})
