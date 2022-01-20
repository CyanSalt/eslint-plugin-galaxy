import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-invalid-vue-prop-keys'

const builtinOptions = [
  'type',
  'required',
  'default',
  'validator',
]

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require valid keys in Vue props options',
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
      [MESSAGE_ID_DEFAULT]: 'Invalid key "{{name}}" in props options',
    },
  },
  defaultOptions: [
    { allows: [] as string[] },
  ],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')
    const allowedOptions = [
      ...builtinOptions,
      ...context.options[0]?.allows ?? [],
    ]
    return utils.executeOnVue(context, (obj) => {
      const propsProperty = utils.findProperty(obj, 'props')
      if (!propsProperty || propsProperty.value.type !== 'ObjectExpression') {
        return
      }
      for (const item of propsProperty.value.properties) {
        if (item.value && item.value.type === 'ObjectExpression') {
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
