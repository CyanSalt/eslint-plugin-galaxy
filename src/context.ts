import type { TSESLint } from '@typescript-eslint/utils'

export function getModuleScope(context: TSESLint.RuleContext<string, unknown[]>) {
  const scope = context.getScope()
  return scope.type === 'module'
    ? scope
    : scope.childScopes.find(item => item.type === 'module')
}
