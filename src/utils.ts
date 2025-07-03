import * as path from 'path'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'

interface RuleDocs {
  recommended?: 'recommended' | 'stylistic',
}

export type Rule = TSESLint.RuleModule<string, unknown[], RuleDocs> & {
  meta: Required<Pick<TSESLint.RuleMetaData<string, RuleDocs>, 'docs'>>,
}

export const createRule = ESLintUtils.RuleCreator<RuleDocs>(name => {
  const dirname = path.relative(__dirname, path.dirname(name))
  const basename = path.basename(name, path.extname(name))
  return `https://github.com/CyanSalt/eslint-plugin-galaxy/blob/master/docs/${dirname}/${basename}.md`
})

function mergeRuleFunctions(
  fn1: TSESLint.RuleFunction,
  fn2: TSESLint.RuleFunction,
): TSESLint.RuleFunction {
  return function (this: unknown, ...args: Parameters<TSESLint.RuleFunction>) {
    fn1.call(this, ...args)
    fn2.call(this, ...args)
  }
}

export function createRuleListenerFromEntries(
  entries: Iterable<readonly [PropertyKey, TSESLint.RuleFunction]>,
) {
  return Array.from(entries).reduce((listener, [selector, fn]) => {
    listener[selector] = listener[selector] ? mergeRuleFunctions(listener[selector], fn) : fn
    return listener
  }, {})
}

export function universal(context: TSESLint.RuleContext<string, unknown[]>, visitor: TSESLint.RuleListener) {
  try {
    const utils = require('eslint-plugin-vue/lib/utils')
    return utils.compositingVisitors(
      utils.defineTemplateBodyVisitor(context, visitor),
      visitor,
    )
  } catch {
    return visitor
  }
}

export function getImportedName(specifier: TSESTree.ImportSpecifier) {
  return specifier.imported.type === AST_NODE_TYPES.Identifier
    ? specifier.imported.name
    : specifier.imported.value
}
