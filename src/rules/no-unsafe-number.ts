import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { isIdentifierOf } from '../estree'
import { createRule, universal } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-unsafe-number'

function isNumberFunction(node: TSESTree.Expression) {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return [
      'Bigint',
      'Number',
      'parseFloat',
      'parseInt',
    ].includes(node.name)
  }
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    const object = node.object
    const property = node.property
    if (object.type === AST_NODE_TYPES.Identifier && property.type === AST_NODE_TYPES.Identifier) {
      switch (object.name) {
        case 'Bigint':
          return true
        case 'Math':
          return true
        case 'Number':
          return [
            'parseFloat',
            'parseInt',
          ].includes(property.name)
      }
    }
    return false
  }
  return false
}

function isNaNable(node: TSESTree.Expression) {
  if (node.parent.type === AST_NODE_TYPES.TSAsExpression && node.parent.expression === node) {
    return isNaNable(node.parent)
  }
  if (
    node.parent.type === 'VExpressionContainer' as never
    && node.parent.parent!.type === 'VAttribute' as never
  ) {
    const key = node.parent.parent!['key']
    return key.type === 'VDirectiveKey'
      && key.name?.type === 'VIdentifier'
      && ['if', 'else-if', 'show'].includes(key.name.name)
  }
  if (node.parent.type === AST_NODE_TYPES.CallExpression && isIdentifierOf(node.parent.callee, 'Boolean')) return true
  if (node.parent.type === AST_NODE_TYPES.UnaryExpression) {
    if (node.parent.operator === '!') return true
    return isNaNable(node.parent)
  }
  if (node.parent.type === AST_NODE_TYPES.BinaryExpression && ['>', '<'].includes(node.parent.operator)) return true
  if (node.parent.type === AST_NODE_TYPES.LogicalExpression) {
    if (node.parent.operator === '||' && node.parent.left === node) return true
    return isNaNable(node.parent)
  }
  if (node.parent.type === AST_NODE_TYPES.IfStatement && node.parent.test === node) return true
  if (node.parent.type === AST_NODE_TYPES.ConditionalExpression && node.parent.test === node) return true
  return false
}

function isNumericType(node: TSESTree.TypeNode) {
  if (node.type === AST_NODE_TYPES.TSUnionType) return node.types.every(type => isNumericType(type))
  if (node.type === AST_NODE_TYPES.TSIntersectionType) return node.types.some(type => isNumericType(type))
  if (node.type === AST_NODE_TYPES.TSNumberKeyword) return true
  if (node.type === AST_NODE_TYPES.TSBigIntKeyword) return true
  if (node.type === AST_NODE_TYPES.TSLiteralType) {
    if (node.literal.type === AST_NODE_TYPES.Literal) {
      return ['bigint', 'number'].includes(typeof node.literal.value)
    }
    return false
  }
  return false
}

function isNumeric(node: TSESTree.Expression | TSESTree.PrivateIdentifier) {
  if (node.parent.type === AST_NODE_TYPES.TSAsExpression && node.parent.expression === node) {
    if (isNumericType(node.parent.typeAnnotation)) return true
    return isNumeric(node.parent)
  }
  if (node.type === AST_NODE_TYPES.CallExpression && isNumberFunction(node.callee)) return true
  if (node.type === AST_NODE_TYPES.UnaryExpression && [
    '+',
    '-',
    '++',
    '--',
  ].includes(node.operator)) return true
  if (node.type === AST_NODE_TYPES.BinaryExpression) {
    if ([
      '-',
      '*',
      '/',
      '%',
      '**',
      '&',
      '|',
      '^',
      '<<',
      '>>',
      '<<<',
      '>>>',
    ].includes(node.operator)) return true
    if (node.operator === '+') return isNumeric(node.left) || isNumeric(node.right)
  }
  if (node.type === AST_NODE_TYPES.LogicalExpression && [
    '&&',
    '||',
    '??',
  ].includes(node.operator)) return isNumeric(node.left) || isNumeric(node.right)
  if (node.type === AST_NODE_TYPES.AssignmentExpression) {
    if ([
      '-=',
      '*=',
      '/=',
      '%=',
      '**=',
      '&=',
      '|=',
      '^=',
      '<<=',
      '>>=',
      '<<<=',
      '>>>=',
    ].includes(node.operator)) return true
    if ([
      '+=',
      '&&=',
      '||=',
      '??=',
    ].includes(node.operator)) return isNumeric(node.left) || isNumeric(node.right)
  }
  if (node.type === AST_NODE_TYPES.ConditionalExpression) {
    return isNumeric(node.consequent) || isNumeric(node.alternate)
  }
  return false
}

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow optional chain in numerical calculation',
    },
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'This value might be NaN or throw a TypeError.',
    },
  },
  defaultOptions: [],
  create(context) {
    function reportExpression(node: TSESTree.Expression, parent: TSESTree.Expression) {
      if (!isNaNable(parent)) {
        context.report({
          node,
          messageId: MESSAGE_ID_DEFAULT,
        })
      }
    }

    function checkExpression(node: TSESTree.Expression) {
      if (node.parent.type === AST_NODE_TYPES.TSAsExpression && node.parent.expression === node) {
        checkExpression(node.parent)
        return
      }
      if (node.parent.type === AST_NODE_TYPES.BinaryExpression) {
        if ((
          node.parent.operator === '&&'
          && node.parent.left === node
        ) || (
          ['||', '??'].includes(node.parent.operator)
          && node.parent.right === node
        )) {
          checkExpression(node.parent)
          return
        }
      }
      if (node.parent.type === AST_NODE_TYPES.ConditionalExpression && node.parent.test !== node) {
        checkExpression(node.parent)
        return
      }
      if (node.parent.type === AST_NODE_TYPES.CallExpression && node.parent.arguments.includes(node)) {
        if (node.parent.arguments[0] === node && isNumberFunction(node.parent.callee)) {
          reportExpression(node, node.parent)
        }
      } else if (node.parent.type === AST_NODE_TYPES.UnaryExpression) {
        if ([
          '+',
          '-',
          // ++, -- throws SyntaxError
        ].includes(node.parent.operator)) {
          reportExpression(node, node.parent)
        }
      } else if (node.parent.type === AST_NODE_TYPES.BinaryExpression) {
        if ([
          '-',
          '*',
          '/',
          '%',
          '**',
          // &, |, ^, <<, >>, <<<, >>> accepts undefined
        ].includes(node.parent.operator)) {
          reportExpression(node, node.parent)
        }
        if (node.parent.operator === '+') {
          const sibling = node.parent.left === node ? node.parent.right : node.parent.left
          if (isNumeric(sibling)) {
            reportExpression(node, node.parent)
          }
        }
      } else if (node.parent.type === AST_NODE_TYPES.AssignmentExpression) {
        if ([
          '-=',
          '*=',
          '/=',
          '%=',
        ].includes(node.parent.operator)) {
          reportExpression(node, node.parent)
        }
      }
    }

    return universal(context, {
      ChainExpression(node) {
        checkExpression(node)
      },
    })
  },
})
