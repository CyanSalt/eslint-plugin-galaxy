import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, AST_TOKEN_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_LITERAL = 'no-unnecessary-optional-chain.literal'
const MESSAGE_ID_NON_NULLABLE = 'no-unnecessary-optional-chain.non-nullable'

const NON_NULLABLE_TYPES = [
  AST_NODE_TYPES.ArrayExpression,
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.ClassExpression,
  AST_NODE_TYPES.FunctionExpression,
  AST_NODE_TYPES.ImportExpression,
  AST_NODE_TYPES.Literal,
  AST_NODE_TYPES.NewExpression,
  AST_NODE_TYPES.ObjectExpression,
  AST_NODE_TYPES.TemplateLiteral,
]

type MaybeOptionalExpression = TSESTree.MemberExpression | TSESTree.CallExpression

function getMaybeOptionalExpressionObject(node: MaybeOptionalExpression) {
  return node.type === AST_NODE_TYPES.MemberExpression ? node.object : node.callee
}

function *removeOptionalChain(
  code: TSESLint.SourceCode,
  fixer: TSESLint.RuleFixer,
  node: TSESTree.Node,
  computed?: boolean,
) {
  const nextToken = code.getTokenAfter(node)
  if (nextToken?.type === AST_TOKEN_TYPES.Punctuator && nextToken.value === '?.') {
    yield fixer.replaceText(nextToken, computed ? '' : '.')
  }
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    const isComputed = node.computed || node.object.type === AST_NODE_TYPES.CallExpression
    yield* removeOptionalChain(code, fixer, node.object, isComputed)
  }
}

function getChainingExpressions(node: TSESTree.Expression): TSESTree.Expression[] {
  if (node.type === AST_NODE_TYPES.ChainExpression) {
    return getChainingExpressions(node.expression)
  }
  if (node.type === AST_NODE_TYPES.CallExpression) {
    return getChainingExpressions(node.callee)
  }
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    return getChainingExpressions(node.object).concat([node])
  }
  return [node]
}

function isTheSameAccessor(
  expr1: TSESTree.PrivateIdentifier | TSESTree.Expression,
  expr2: TSESTree.PrivateIdentifier | TSESTree.Expression,
): boolean {
  if (expr1.type === AST_NODE_TYPES.ThisExpression) {
    return expr2.type === AST_NODE_TYPES.ThisExpression
  }
  if (expr1.type === AST_NODE_TYPES.Identifier) {
    return expr2.type === AST_NODE_TYPES.Identifier
      && expr1.name === expr2.name
  }
  if (expr1.type === AST_NODE_TYPES.PrivateIdentifier) {
    return expr2.type === AST_NODE_TYPES.PrivateIdentifier
      && expr1.name === expr2.name
  }
  if (expr1.type === AST_NODE_TYPES.MemberExpression) {
    return expr2.type === AST_NODE_TYPES.MemberExpression
      && isTheSameAccessor(expr1.object, expr2.object)
      && isTheSameAccessor(expr1.property, expr2.property)
  }
  return false
}

export default createRule({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unnecessary optional chain',
      recommended: 'recommended',
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID_LITERAL]: 'Unnecessary optional chain on a literal value.',
      [MESSAGE_ID_NON_NULLABLE]: 'Unnecessary optional chain on a non-nullish value.',
    },
  },
  defaultOptions: [],
  create(context) {
    const esquery = require('esquery')
    const code = context.getSourceCode()

    function getNonNullableChainingExpressions(node: TSESTree.Expression) {
      if (node.type === AST_NODE_TYPES.LogicalExpression) {
        switch (node.operator) {
          case '&&':
            return [
              ...getNonNullableExpressions(node.left),
              ...getNonNullableExpressions(node.right),
            ]
          default:
            return getNonNullableExpressions(node.left, true)
        }
      }
      return getChainingExpressions(node)
    }

    function getNonNullableExpressions(
      node: TSESTree.Expression,
      indeterminate?: boolean,
    ): ReturnType<typeof getMaybeOptionalExpressionObject>[] {
      const usedExpressions = esquery.query(node, 'MemberExpression[optional!=true], CallExpression[optional!=true]')
        .map(getMaybeOptionalExpressionObject)
      return indeterminate
        ? usedExpressions
        : usedExpressions.concat(getNonNullableChainingExpressions(node))
    }

    function checkStatement(
      node: TSESTree.Expression | TSESTree.Statement,
      markedExpressions: TSESTree.Expression[],
    ) {
      const expressions: ReturnType<typeof getMaybeOptionalExpressionObject>[] = esquery.query(node, 'ChainExpression :matches(MemberExpression[optional=true], CallExpression[optional=true])')
        .map(getMaybeOptionalExpressionObject)
      for (const expr of expressions) {
        const markedReference = markedExpressions.find(item => isTheSameAccessor(expr, item))
        if (markedReference) {
          context.report({
            node: expr,
            messageId: MESSAGE_ID_NON_NULLABLE,
            *fix(fixer) {
              const isComputed = expr.parent.type === AST_NODE_TYPES.MemberExpression && expr.parent.computed
                || expr.parent.type === AST_NODE_TYPES.CallExpression
              yield* removeOptionalChain(code, fixer, expr, isComputed)
            },
          })
        }
      }
    }

    return {
      [`:matches(${NON_NULLABLE_TYPES.join(',')})[parent.optional=true]`](node: TSESTree.Node) {
        context.report({
          node,
          messageId: MESSAGE_ID_LITERAL,
          *fix(fixer) {
            if (!node.parent) return
            const isComputed = node.parent.type === AST_NODE_TYPES.MemberExpression && node.parent.computed
              || node.parent.type === AST_NODE_TYPES.CallExpression
            yield* removeOptionalChain(code, fixer, node, isComputed)
          },
        })
      },
      // if (foo) bar
      IfStatement(node) {
        const markedExpressions = getNonNullableExpressions(node.test)
        checkStatement(node.consequent, markedExpressions)
      },
      // foo ? bar : baz
      ConditionalExpression(node) {
        const markedExpressions = getNonNullableExpressions(node.test)
        checkStatement(node.consequent, markedExpressions)
      },
      // foo && bar
      'LogicalExpression[operator="&&"]'(node: TSESTree.LogicalExpression) {
        const markedExpressions = getNonNullableExpressions(node.left)
        checkStatement(node.right, markedExpressions)
      },
      // foo + bar
      BinaryExpression(node) {
        if (node.left.type !== AST_NODE_TYPES.PrivateIdentifier) {
          const leftMarkedExpressions = getNonNullableExpressions(node.left, true)
          checkStatement(node.right, leftMarkedExpressions)
          const rightMarkedExpressions = getNonNullableExpressions(node.right, true)
          checkStatement(node.left, rightMarkedExpressions)
        }
      },
    }
  },
})
