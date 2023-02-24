import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

export function isIdentifierOf(
  node: TSESTree.Node,
  name: string,
): node is TSESTree.Identifier {
  return (node.type === AST_NODE_TYPES.Identifier || node.type === AST_NODE_TYPES.PrivateIdentifier)
    && node.name === name
}

export function getRealExpression(node: TSESTree.Node): Exclude<TSESTree.Node, TSESTree.TSAsExpression> {
  return node.type === AST_NODE_TYPES.TSAsExpression ? getRealExpression(node.expression) : node
}

export function isArrayExpressionIncludesIdentifier(
  node: TSESTree.Node,
  name: string,
): node is TSESTree.ArrayExpression {
  return node.type === AST_NODE_TYPES.ArrayExpression && node.elements.some(el => {
    const expr = getRealExpression(el)
    return isIdentifierOf(expr, name)
  })
}

export function isObjectDestructure(
  node: TSESTree.Node,
): node is TSESTree.VariableDeclarator & {
  id: TSESTree.ObjectPattern,
} {
  return node.type === AST_NODE_TYPES.VariableDeclarator
    && node.id.type === AST_NODE_TYPES.ObjectPattern
}

export function isIdentifierProperty(
  node: TSESTree.Node,
): node is TSESTree.Property & { key: TSESTree.Identifier } {
  return node.type === AST_NODE_TYPES.Property && node.key.type === AST_NODE_TYPES.Identifier
}
