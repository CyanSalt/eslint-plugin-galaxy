import * as path from 'path'
import { ESLintUtils } from '@typescript-eslint/experimental-utils'

export const createRule = ESLintUtils.RuleCreator(name => {
  const basename = path.basename(name, path.extname(name))
  return `https://github.com/CyanSalt/eslint-plugin-galaxy/blob/master/docs/rules/${basename}.md`
})
