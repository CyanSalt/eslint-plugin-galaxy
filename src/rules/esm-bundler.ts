import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_PROCESS_ENV = 'esm-bundler.process-env'
const MESSAGE_ID_COMMON_JS = 'esm-bundler.common-js'
const MESSAGE_ID_REQUIRE = 'esm-bundler.require'
const MESSAGE_ID_SUGGESTION_IMPORT_META_ENV = 'suggestion@esm-bundler.import-meta-env'

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce ES Module bundler APIs instead of Node APIs',
    },
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          allowProcessEnv: {
            type: 'boolean',
          },
          allowCommonJs: {
            type: 'boolean',
          },
          allowRequire: {
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      [MESSAGE_ID_PROCESS_ENV]: '"process.env" is not available at runtime',
      [MESSAGE_ID_COMMON_JS]: 'Expected "export" or "export default"',
      [MESSAGE_ID_REQUIRE]: 'Expected "import" instead of "require()"',
      [MESSAGE_ID_SUGGESTION_IMPORT_META_ENV]: 'Use "import.meta.env" instead',
    },
  },
  defaultOptions: [
    {
      allowProcessEnv: false,
      allowCommonJs: false,
      allowRequire: false,
    } as {
      allowProcessEnv?: boolean,
      allowCommonJs?: boolean,
      allowRequire?: boolean,
    },
  ],
  create(context) {
    const allowProcessEnv = context.options[0]?.allowProcessEnv
    const allowCommonJs = context.options[0]?.allowCommonJs
    const allowRequire = context.options[0]?.allowRequire

    const visitor: TSESLint.RuleListener = {}

    if (!allowProcessEnv) {
      visitor[
        'MemberExpression[object.name="process"][property.name="env"]'
      ] = (node: TSESTree.MemberExpression) => {
        context.report({
          node,
          messageId: MESSAGE_ID_PROCESS_ENV,
          suggest: [
            {
              messageId: MESSAGE_ID_SUGGESTION_IMPORT_META_ENV,
              fix(fixer) {
                return fixer.replaceText(node.object, 'import.meta')
              },
            },
          ],
        })
      }
    }

    if (!allowCommonJs) {
      visitor[
        'MemberExpression[object.name="module"][property.name="exports"]'
      ] = (node: TSESTree.MemberExpression) => {
        context.report({
          node,
          messageId: MESSAGE_ID_COMMON_JS,
        })
      }
      visitor[
        'MemberExpression[object.name="exports"]'
      ] = (node: TSESTree.MemberExpression) => {
        const scope = context.getScope()
        if (!scope.variables.some(variable => variable.name === 'exports')) {
          context.report({
            node,
            messageId: MESSAGE_ID_COMMON_JS,
          })
        }
      }
    }

    if (!allowRequire) {
      visitor[
        'CallExpression[callee.name="require"], MemberExpression[object.name="require"]'
      ] = (node: TSESTree.CallExpression) => {
        context.report({
          node,
          messageId: MESSAGE_ID_REQUIRE,
        })
      }
    }

    try {
      const utils = require('eslint-plugin-vue/lib/utils')
      return utils.compositingVisitors(
        utils.defineTemplateBodyVisitor(context, visitor),
        visitor,
      )
    } catch {
      return visitor
    }
  },
})
