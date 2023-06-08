import * as path from 'path'
import type { TSESLint } from '@typescript-eslint/utils'
import { ESLintUtils } from '@typescript-eslint/utils'

export const createRule = ESLintUtils.RuleCreator(name => {
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
