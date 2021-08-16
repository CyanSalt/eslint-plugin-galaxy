import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-invalid-vue-inject-keys'

const builtinOptions = [
  'from',
  'default',
]

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Possible Errors',
      description: 'Require valid keys in Vue inject options',
      recommended: 'error',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allows: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Invalid key "{{name}}" in inject options',
    },
  },
  defaultOptions: [
    { allows: [] as string[] },
  ],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')
    const allowedOptions = [
      ...builtinOptions,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      ...context.options[0]?.allows ?? [],
    ]
    return utils.executeOnVue(context, (obj) => {
      const injectProperty = utils.findProperty(obj, 'inject')
      if (!injectProperty || injectProperty.value.type !== 'ObjectExpression') {
        return
      }
      for (const item of injectProperty.value.properties) {
        if (item.value.type === 'ObjectExpression') {
          for (const property of item.value.properties) {
            const name = utils.getStaticPropertyName(property)
            if (!allowedOptions.includes(name)) {
              context.report({
                node: property,
                messageId: MESSAGE_ID_DEFAULT,
                data: {
                  name,
                },
              })
            }
          }
        }
      }
    })
  },
})
