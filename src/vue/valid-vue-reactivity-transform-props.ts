import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { getModuleScope } from '../context'
import { getRealExpression, isArrayExpressionIncludesIdentifier, isIdentifierOf, isIdentifierProperty, isObjectDestructure } from '../estree'
import { createRule } from '../utils'
import { isReactivityTransformCall } from './vue-reactivity-transform-uses-vars'

const MESSAGE_ID_TRANSFORM = 'valid-vue-reactivity-transform-props.transform'
const MESSAGE_ID_OPTIONAL = 'valid-vue-reactivity-transform-props.optional'
const MESSAGE_ID_OBJECT_DEFAULTS = 'valid-vue-reactivity-transform-props.object-defaults'
const MESSAGE_ID_DEFAULTS_TYPE = 'valid-vue-reactivity-transform-props.defaults-type'

function getNestingCallSelector(callees: string[]) {
  return `CallExpression > CallExpression:matches(${
    callees.map(callee => `[callee.name="${callee}"]`).join(', ')
  })`
}

function isVueFunctionType(prop: any) {
  if (prop.type === 'type' || prop.type === 'infer-type') {
    return prop.types?.includes('Function')
  } else {
    const expr = getRealExpression(prop.value)
    return isIdentifierOf(expr, 'Function') || isArrayExpressionIncludesIdentifier(expr, 'Function')
  }
}

export default createRule({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vue props with Reactivity Transform to be valid',
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID_TRANSFORM]: 'Disallow using Reactivity Transform for "{{name}}" calls',
      [MESSAGE_ID_OPTIONAL]: 'Prop "{{name}}" should be optional.',
      [MESSAGE_ID_OBJECT_DEFAULTS]: 'Type of the default value for "{{name}}" prop must be a function.',
      [MESSAGE_ID_DEFAULTS_TYPE]: 'Type of default value should alway be "never".',
    },
  },
  defaultOptions: [],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')
    const code = context.getSourceCode()
    return utils.defineScriptSetupVisitor(context, {
      [getNestingCallSelector([
        'defineProps',
        'withDefaults',
      ])](node: TSESTree.CallExpression & { parent: TSESTree.CallExpression, callee: TSESTree.Identifier }) {
        const scope = getModuleScope(context)
        if (!scope) return
        if (!isReactivityTransformCall(node.parent, scope, ['$'])) return
        const name = node.callee.name
        const reactivityTransform = node.parent as TSESTree.CallExpression
        context.report({
          node,
          messageId: MESSAGE_ID_TRANSFORM,
          data: {
            name,
          },
          *fix(fixer) {
            if (name === 'defineProps') {
              yield fixer.replaceText(reactivityTransform, code.getText(node))
            }
            if (
              name === 'withDefaults'
              && isObjectDestructure(reactivityTransform.parent)
              && node.arguments[1]
              && node.arguments[1].type === AST_NODE_TYPES.ObjectExpression
            ) {
              const pattern = reactivityTransform.parent.id
              const defaultValueProperties = node.arguments[1].properties.filter(isIdentifierProperty)
              const declarationProperties = pattern.properties.filter(isIdentifierProperty)
              const restDefaultValues = defaultValueProperties
                .filter(item => !declarationProperties.some(decl => decl.key.name === item.key.name))
              const restComments = restDefaultValues.length
                ? `/* ${restDefaultValues.map(prop => `, ${prop.key.name} = ${code.getText(prop.value)}`)} */`
                : ''
              for (let i = 0; i < declarationProperties.length; i += 1) {
                const decl = declarationProperties[i]
                let text = ''
                if (decl.value.type === 'Identifier') {
                  const defaultValue = defaultValueProperties.find(item => item.key.name === decl.key.name)
                  if (defaultValue) {
                    text = ` = ${code.getText(defaultValue.value)}`
                  }
                }
                if (i === declarationProperties.length - 1) {
                  text += restComments
                }
                if (text) {
                  yield fixer.insertTextAfter(decl.value, text)
                }
              }
              yield fixer.replaceText(reactivityTransform, code.getText(node.arguments[0]))
            }
          },
        })
      },
      onDefinePropsEnter(node: TSESTree.CallExpression, baseProps: any[]) {
        if (isObjectDestructure(node.parent)) {
          const pattern = node.parent.id
          const declarationProperties = pattern.properties.filter(isIdentifierProperty)
          for (const decl of declarationProperties) {
            if (decl.value.type === AST_NODE_TYPES.AssignmentPattern) {
              const defaultValueNode = decl.value.right
              const type = baseProps.find(prop => prop.propName === decl.key.name)
              const willCallDefaultValueFunction = !type || !isVueFunctionType(type)
              if (type?.required) {
                context.report({
                  node: type.node,
                  messageId: MESSAGE_ID_OPTIONAL,
                  data: {
                    name: decl.key.name,
                  },
                  fix(fixer) {
                    const token = code.getTokenAfter(type.node.key)
                    if (token?.type === 'Punctuator' && token.value === ':') {
                      return fixer.replaceText(token, '?:')
                    }
                    return null
                  },
                })
              }
              if (
                defaultValueNode.type === AST_NODE_TYPES.ObjectExpression
                || defaultValueNode.type === AST_NODE_TYPES.ArrayExpression
              ) {
                context.report({
                  node: decl.value.right,
                  messageId: MESSAGE_ID_OBJECT_DEFAULTS,
                  data: {
                    name: decl.key.name,
                  },
                  *fix(fixer) {
                    if (defaultValueNode.type === AST_NODE_TYPES.ObjectExpression) {
                      yield fixer.insertTextBefore(defaultValueNode, '() => (')
                      yield fixer.insertTextAfter(defaultValueNode, ')')
                    } else {
                      yield fixer.insertTextBefore(defaultValueNode, '() => ')
                    }
                  },
                })
              }
              if (
                defaultValueNode.type === AST_NODE_TYPES.ArrowFunctionExpression
                && willCallDefaultValueFunction
              ) {
                const parserServices = context.parserServices
                if (parserServices && 'esTreeNodeToTSNodeMap' in parserServices) {
                  context.report({
                    node: decl.value.right,
                    messageId: MESSAGE_ID_DEFAULTS_TYPE,
                    *fix(fixer) {
                      yield fixer.insertTextBefore(defaultValueNode, '(')
                      yield fixer.insertTextAfter(defaultValueNode, ') as never')
                    },
                  })
                }
              }
              if (
                defaultValueNode.type === AST_NODE_TYPES.TSAsExpression
                && defaultValueNode.typeAnnotation.type !== AST_NODE_TYPES.TSNeverKeyword
                && willCallDefaultValueFunction
              ) {
                context.report({
                  node: decl.value.right,
                  messageId: MESSAGE_ID_DEFAULTS_TYPE,
                  fix(fixer) {
                    return fixer.replaceText(defaultValueNode.typeAnnotation, 'never')
                  },
                })
              }
            }
          }
        }
      },
    })
  },
})
