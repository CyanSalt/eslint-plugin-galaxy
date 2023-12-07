import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_TOKEN_TYPES } from '@typescript-eslint/utils'

export function *removeTrailingComma(code: TSESLint.SourceCode, fixer: TSESLint.RuleFixer, node: TSESTree.Node) {
  const nextToken = code.getTokenAfter(node)
  if (nextToken?.type === AST_TOKEN_TYPES.Punctuator && nextToken.value === ',') {
    yield fixer.remove(nextToken)
  }
}

export type ArrayOrObjectElement = TSESTree.Expression | TSESTree.DestructuringPattern | TSESTree.ObjectLiteralElement

export function *removeElement(
  code: TSESLint.SourceCode,
  fixer: TSESLint.RuleFixer,
  node: ArrayOrObjectElement,
) {
  const beforeToken = code.getTokenBefore(node)!
  let lastToken: TSESTree.Node | TSESTree.Token | null = code.getTokenAfter(node)
  if (!lastToken || lastToken.type !== AST_TOKEN_TYPES.Punctuator || lastToken.value !== ',') {
    lastToken = node
  }
  yield fixer.removeRange([beforeToken.range[0] + 1, lastToken.range[1]])
}
