import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-shared-vue-provide'

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce the `provide` option of Vue component to be a function',
      recommended: 'error',
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'The `provide` option of component must be a function',
    },
  },
  defaultOptions: [],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')
    const code = context.getSourceCode()
    return utils.executeOnVue(context, (obj) => {
      const provideProperty = utils.findProperty(obj, 'provide')
      const functionOrIdentTypes = ['FunctionExpression', 'ArrowFunctionExpression', 'Identifier']
      if (!provideProperty || functionOrIdentTypes.includes(provideProperty.value.type)) {
        return
      }
      context.report({
        node: provideProperty,
        messageId: MESSAGE_ID_DEFAULT,
        fix(fixer) {
          return [
            fixer.insertTextBefore(
              code.getFirstToken(provideProperty.value)!,
              'function () {\nreturn ',
            ),
            fixer.insertTextAfter(
              code.getLastToken(provideProperty.value)!,
              ';\n}',
            ),
          ]
        },
      })
    })
  },
})
