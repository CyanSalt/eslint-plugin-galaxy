import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

export function *removeElement(
  code: TSESLint.SourceCode,
  fixer: TSESLint.RuleFixer,
  node: TSESTree.DestructuringPattern | TSESTree.ObjectLiteralElement,
) {
  const beforeToken = code.getTokenBefore(node)!
  let lastToken: TSESTree.Node | TSESTree.Token | null = code.getTokenAfter(node)
  if (!lastToken || lastToken.type !== 'Punctuator' || lastToken.value !== ',') {
    lastToken = node
  }
  return fixer.removeRange([beforeToken.range[0] + 1, lastToken!.range[1]])
}
