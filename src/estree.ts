import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

export function isIdentifierOf(
  node: TSESTree.Node,
  name: string | string[],
): node is TSESTree.Identifier {
  return (node.type === AST_NODE_TYPES.Identifier || node.type === AST_NODE_TYPES.PrivateIdentifier)
    && (Array.isArray(name) ? name.includes(node.name) : node.name === name)
}

export function isMemberExpressionOf(
  node: TSESTree.Node,
  object: string,
  property?: string | string[],
): node is TSESTree.MemberExpression {
  return node.type === AST_NODE_TYPES.MemberExpression
    && isIdentifierOf(node.object, object)
    && (!property || isIdentifierOf(node.property, property))
}

export function getRealExpression(node: TSESTree.Node): Exclude<TSESTree.Node, TSESTree.TSAsExpression> {
  return node.type === AST_NODE_TYPES.TSAsExpression ? getRealExpression(node.expression) : node
}

export function isArrayExpressionIncludesIdentifier(
  node: TSESTree.Node,
  name: string | string[],
): node is TSESTree.ArrayExpression {
  return node.type === AST_NODE_TYPES.ArrayExpression && node.elements.some(el => {
    if (!el) return false
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

export function *iterateNodeFactory(node: TSESTree.Node, scope: TSESLint.Scope.Scope): Generator<TSESTree.Node> {
  yield node
  if (node.type === AST_NODE_TYPES.CallExpression) {
    return yield* iterateNodeFactory(node.callee, scope)
  }
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    return yield* iterateNodeFactory(node.object, scope)
  }
  if (node.type === AST_NODE_TYPES.Identifier) {
    for (const variable of scope.variables) {
      if (variable.name === node.name) {
        if (!variable.defs.length) return undefined
        for (const def of variable.defs) {
          // def is ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier
          if (def.node.parent?.type === AST_NODE_TYPES.ImportDeclaration) {
            yield def.node.parent
            return
          }
          if (def.node.type === AST_NODE_TYPES.VariableDeclarator && def.node.init) {
            yield* iterateNodeFactory(def.node.init, variable.scope)
            return
          }
        }
      }
    }
    if (scope.upper) {
      yield* iterateNodeFactory(node, scope.upper)
    }
  }
}

export function getLiteralValue(node: TSESTree.Node) {
  if (node.type === AST_NODE_TYPES.TemplateLiteral && !node.expressions.length && node.quasis.length === 1) {
    return node.quasis[0].value.cooked
  }
  if (node.type === AST_NODE_TYPES.Literal) {
    return node.value
  }
  return undefined
}
