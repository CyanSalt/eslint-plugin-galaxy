import type { TSESTree, TSESLint } from '@typescript-eslint/experimental-utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'order-in-vue-options'

type Order = string[] | undefined

type OptionItem = string | {
  name: string,
  order?: Order,
}

function checkOrder(
  context: TSESLint.RuleContext<typeof MESSAGE_ID_DEFAULT, unknown[]>,
  propertiesNodes: TSESTree.ObjectLiteralElementLike[],
  order: Order,
) {
  const utils = require('eslint-plugin-vue/lib/utils')
  const source = context.getSourceCode()
  const properties = propertiesNodes.map(node => ({
    node,
    name: utils.getStaticPropertyName(node) as string | null,
  }))
  properties.forEach((property, propertyIndex) => {
    const name = property.name
    if (!name) return
    let index = -1
    if (Array.isArray(order)) {
      index = order.indexOf(name)
      if (index === -1) return
    }
    const propertiesAbove = properties.slice(0, propertyIndex)
    const unorderedProperty = propertiesAbove.find(p => {
      if (!p.name) return false
      if (Array.isArray(order)) {
        const pIndex = order.indexOf(p.name)
        return pIndex !== -1 && pIndex > index
      } else {
        return p.name.localeCompare(name) > 0
      }
    })

    if (unorderedProperty) {
      context.report({
        node: property.node,
        messageId: MESSAGE_ID_DEFAULT,
        data: {
          name,
          target: unorderedProperty.name,
        },
        *fix(fixer) {
          const propertyNode = property.node

          const beforeToken = source.getTokenBefore(propertyNode)
          if (!beforeToken) return null

          const afterToken = source.getTokenAfter(propertyNode)
          if (!afterToken) return null
          const hasAfterComma = afterToken.type === 'Punctuator' && afterToken.value === ','

          const codeStart = beforeToken.range[1] // to include comments
          const codeEnd = hasAfterComma
            ? afterToken.range[1]
            : propertyNode.range[1]

          const removeStart = hasAfterComma
            ? codeStart
            : beforeToken.range[0]
          yield fixer.removeRange([removeStart, codeEnd])

          const propertyCode
            = source.text.slice(codeStart, codeEnd)
            + (hasAfterComma ? '' : ',')
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const insertTarget = source.getTokenBefore(unorderedProperty.node)!

          yield fixer.insertTextAfter(insertTarget, propertyCode)
        },
      })
    }
  })
}

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Stylistic Issues',
      description: 'Enforce a convention in the order of specified options in Vue components',
      recommended: false,
    },
    fixable: 'code',
    schema: {
      type: 'array',
      items: {
        oneOf: [
          {
            type: 'string',
          },
          {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              order: {
                oneOf: [
                  {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                  {
                    type: 'null',
                  },
                ],
              },
            },
            additionalProperties: false,
          },
        ],
      },
    },
    messages: {
      [MESSAGE_ID_DEFAULT]: '`The "{{name}}" property should be above the "{{target}}" property.',
    },
  },
  defaultOptions: [] as OptionItem[],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')
    return utils.executeOnVue(context, (obj: TSESTree.ObjectExpression) => {
      for (const property of obj.properties) {
        const name: string | null = utils.getStaticPropertyName(property)
        if (property.type === 'Property' && name) {
          let matchedOption = context.options.find(item => {
            return typeof item === 'string'
              ? item === name
              : item.name === name
          })
          if (typeof matchedOption === 'string') {
            matchedOption = { name: matchedOption }
          }
          if (matchedOption) {
            const node = property.value
            if (node.type === 'ObjectExpression') {
              checkOrder(context, node.properties, matchedOption.order)
            }
          }
        }
      }
    })
  },
})
