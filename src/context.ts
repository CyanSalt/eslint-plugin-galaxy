import type { TSESLint } from '@typescript-eslint/utils'

export function getModuleScope(context: TSESLint.RuleContext<string, unknown[]>) {
  const globalScope = context.sourceCode.scopeManager?.globalScope
  return globalScope?.childScopes.find(item => item.type === 'module')
}
