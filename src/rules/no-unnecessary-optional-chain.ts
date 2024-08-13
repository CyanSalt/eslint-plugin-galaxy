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

function getAncestors(node: TSESTree.Node): TSESTree.Node[] {
  return node.parent ? getAncestors(node.parent).concat(node.parent) : []
}

function *removeOptionalChain(
  code: TSESLint.SourceCode,
  fixer: TSESLint.RuleFixer,
  node: MaybeOptionalExpression,
) {
  const isComputed = node.type === AST_NODE_TYPES.MemberExpression && node.computed
    || node.type === AST_NODE_TYPES.CallExpression
  const object = getMaybeOptionalExpressionObject(node)
  const nextToken = code.getTokenAfter(object)
  if (nextToken?.type === AST_TOKEN_TYPES.Punctuator && nextToken.value === '?.') {
    yield fixer.replaceText(nextToken, isComputed ? '' : '.')
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
  if (expr1.type === AST_NODE_TYPES.Literal) {
    return expr2.type === AST_NODE_TYPES.Literal
      && expr1.value === expr2.value
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
    const code = context.sourceCode
    const parserServices = code.parserServices

    function getTokenStore(node: TSESTree.Node) {
      if (code.ast['templateBody']) {
        const ancestors = getAncestors(node)
        // @ts-expect-error vue-eslint-parser API
        if (ancestors.includes(code.ast['templateBody']) && parserServices?.getTemplateBodyTokenStore) {
          // @ts-expect-error vue-eslint-parser API
          return parserServices.getTemplateBodyTokenStore()
        }
      }
      return code
    }

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

    function checkExpression(
      expression: MaybeOptionalExpression,
      markedExpressions: TSESTree.Expression[],
    ) {
      if (!markedExpressions.length) return
      const expr = getMaybeOptionalExpressionObject(expression)
      const markedReference = markedExpressions.find(item => isTheSameAccessor(expr, item))
      if (markedReference) {
        context.report({
          node: expr,
          messageId: MESSAGE_ID_NON_NULLABLE,
          *fix(fixer) {
            yield* removeOptionalChain(getTokenStore(expression), fixer, expression)
          },
        })
      }
    }

    function checkStatement(
      node: TSESTree.Expression | TSESTree.Statement,
      markedExpressions: TSESTree.Expression[],
    ) {
      if (!markedExpressions.length) return
      esquery.query(node, 'MemberExpression[optional=true], CallExpression[optional=true]').forEach(expr => {
        checkExpression(expr, markedExpressions)
      })
    }

    const scriptVisitor: TSESLint.RuleListener = {
      [`MemberExpression[optional=true]:matches(${NON_NULLABLE_TYPES.map(type => `[object.type=${type}]`).join(', ')}), CallExpression[optional=true]:matches(${NON_NULLABLE_TYPES.map(type => `[callee.type=${type}]`).join(', ')})`](node: MaybeOptionalExpression) {
        context.report({
          node,
          messageId: MESSAGE_ID_LITERAL,
          *fix(fixer) {
            yield* removeOptionalChain(getTokenStore(node), fixer, node)
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

    const vueIfAttributes: {
      element: TSESTree.Node,
      attribute: TSESTree.Node,
      expressions: ReturnType<typeof getNonNullableExpressions>,
    }[] = []
    const vueOptionalExpressions: MaybeOptionalExpression[] = []

    const vueTemplateVisitor: TSESLint.RuleListener = {
      ...scriptVisitor,
      // <tag v-if="foo" :prop="bar">{{ bar }}</tag>
      'VElement > VStartTag > VAttribute[directive=true][value.type="VExpressionContainer"]:matches([key.name.name="if"], [key.name.name="else-if"])'(node: any) {
        vueIfAttributes.push({
          element: node.parent.parent,
          attribute: node,
          expressions: getNonNullableExpressions(node.value.expression),
        })
      },
      'MemberExpression[optional=true], CallExpression[optional=true]'(node) {
        vueOptionalExpressions.push(node)
      },
      'VElement[parent.type!=\'VElement\']:exit'() {
        for (const expression of vueOptionalExpressions) {
          const ancestors = getAncestors(expression)
          const markedExpressions = vueIfAttributes.flatMap(attr => {
            return ancestors.includes(attr.element) && !ancestors.includes(attr.attribute)
              ? attr.expressions
              : []
          })
          checkExpression(expression, markedExpressions)
        }
      },
    }

    // @ts-expect-error vue-eslint-parser API
    if (parserServices?.defineTemplateBodyVisitor) {
      // @ts-expect-error vue-eslint-parser API
      return parserServices.defineTemplateBodyVisitor(vueTemplateVisitor, scriptVisitor)
    } else {
      return scriptVisitor
    }
  },
})
