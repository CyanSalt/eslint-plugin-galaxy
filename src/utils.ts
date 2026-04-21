import { createRequire } from 'module'
import * as path from 'path'
import type { TSESLint } from '@typescript-eslint/utils'
import { ESLintUtils } from '@typescript-eslint/utils'

export interface RuleDocs {
  recommended?: 'recommended' | 'stylistic',
}

export type Rule = TSESLint.RuleModule<string, readonly unknown[], RuleDocs> & { name: string }

export function getRuleBasename(filename: string) {
  return path.basename(filename, path.extname(filename))
}

export function getRuleName(filename: string) {
  return `@byted-star/${getRuleBasename(filename)}`
}

export const createRule = ESLintUtils.RuleCreator<RuleDocs>(name => {
  const dirname = path.relative(import.meta.dirname, path.dirname(name))
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

export function loadESLintPluginImportUtils() {
  const require = createRequire(import.meta.url)
  const utils = require('eslint-plugin-import-x/utils')
  return utils
}

export function loadESLintPluginVueUtils(subpath?: string) {
  const require = createRequire(import.meta.url)
  try {
    const { default: utils } = require(`eslint-plugin-vue/dist/utils${subpath ? `/${subpath}` : ''}`)
    return utils
  } catch {
    const utils = require(`eslint-plugin-vue/lib/utils${subpath ? `/${subpath}` : ''}`)
    return utils
  }
}

export function universal(context: TSESLint.RuleContext<string, readonly unknown[]>, visitor: TSESLint.RuleListener) {
  try {
    const utils = loadESLintPluginVueUtils()
    return utils.compositingVisitors(
      utils.defineTemplateBodyVisitor(context, visitor),
      visitor,
    )
  } catch {
    return visitor
  }
}
