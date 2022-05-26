import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'conventional-vue-keys-order'

interface RuleDeclaration {
  name?: string,
  key: string,
  type?: 'default' | 'properties' | 'return',
  order: (string | {
    pattern?: string,
    selector?: string,
  })[],
}

interface ParsedOrderTester {
  matchAll?: boolean,
  exact?: string,
  pattern?: RegExp,
  selector?: any,
}

type ParsedRule = Required<Pick<RuleDeclaration, 'key' | 'type'>> & {
  order: ParsedOrderTester[],
}

const DEFAULT_RULES: (RuleDeclaration & { name: string })[] = [
  {
    name: 'model',
    key: 'model',
    order: ['prop', 'event'],
  },
  {
    name: 'props',
    key: 'props',
    order: [
      { selector: 'Property:has(ObjectExpression > Property[key.name="required"][value.value=true])' },
      '*',
    ],
  },
  {
    name: 'props-properties',
    key: 'props',
    type: 'properties',
    order: ['type', 'required', 'default', 'validator'],
  },
  {
    name: 'inject-properties',
    key: 'inject',
    type: 'properties',
    order: ['from', 'default'],
  },
  {
    name: 'emits',
    key: 'emits',
    order: [{ pattern: '^update:' }, '*'],
  },
  {
    name: 'data-return',
    key: 'data',
    type: 'return',
    order: [{ selector: 'Property[shorthand=true][key.name=/^[A-Z]/]' }, '*'],
  },
  {
    name: 'computed',
    key: 'computed',
    order: [{ selector: 'SpreadElement' }, '*'],
  },
  {
    name: 'computed-strict',
    key: 'computed',
    order: [
      { selector: 'SpreadElement:has(CallExpression[callee.name="mapState"])' },
      { selector: 'SpreadElement:has(CallExpression[callee.name="mapGetters"])' },
      { selector: 'SpreadElement:has(CallExpression[callee.name="mapWritableState"])' },
      { selector: 'SpreadElement' },
      '*',
    ],
  },
  {
    name: 'watch-properties',
    type: 'properties',
    key: 'watch',
    order: ['handler', 'immediate', 'deep'],
  },
  {
    name: 'methods',
    key: 'methods',
    order: [
      { selector: 'SpreadElement' },
      { selector: 'Property[value.type="Identifier"]' },
      '*',
    ],
  },
  {
    name: 'methods-strict',
    key: 'methods',
    order: [
      { selector: 'SpreadElement:has(CallExpression[callee.name="mapMutations"])' },
      { selector: 'SpreadElement:has(CallExpression[callee.name="mapActions"])' },
      { selector: 'SpreadElement' },
      { selector: 'Property[value.type="Identifier"]' },
      '*',
    ],
  },
]

function parseRule(rule: RuleDeclaration): ParsedRule {
  return {
    key: rule.key,
    type: rule.type ?? 'default',
    order: rule.order.map(item => {
      if (typeof item === 'string') {
        return item === '*' ? { matchAll: true } : { exact: item }
      }
      const tester: ParsedOrderTester = {}
      if (item.pattern) {
        tester.pattern = new RegExp(item.pattern)
      }
      if (item.selector) {
        const esquery = require('esquery')
        tester.selector = esquery.parse(item.selector)
      }
      return tester
    }),
  }
}

function getPropertyValues(obj: TSESTree.ObjectExpression) {
  return obj.properties.filter(
    (property): property is TSESTree.Property => {
      return property.type === AST_NODE_TYPES.Property
    },
  ).map(property => property.value)
}

function getPropertyName(property: TSESTree.ObjectLiteralElement) {
  if (property.type === AST_NODE_TYPES.SpreadElement || property.computed) return null
  return property.key.type === AST_NODE_TYPES.Literal ? property.key.value : property.key.name
}

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce properties in Vue component options to be sorted in conventional order',
      recommended: 'error',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          rules: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          additionalRules: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                },
                type: {
                  type: 'string',
                },
                order: {
                  type: 'array',
                  items: {
                    anyOf: [
                      {
                        type: 'string',
                      },
                      {
                        type: 'object',
                        properties: {
                          pattern: {
                            type: 'string',
                          },
                          selector: {
                            type: 'string',
                          },
                        },
                      },
                    ],
                  },
                },
              },
              additionalProperties: false,
              required: ['key', 'order'],
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'This property should be above the property on line {{line}}.',
    },
  },
  defaultOptions: [
    {
      rules: [],
      additionalRules: [],
    } as {
      rules?: string[],
      additionalRules?: RuleDeclaration[],
    },
  ],
  create(context) {
    const esquery = require('esquery')
    const utils = require('eslint-plugin-vue/lib/utils')
    const { rules = [], additionalRules = [] } = context.options[0] ?? {}

    const code = context.getSourceCode()

    const allRules = (DEFAULT_RULES.filter(rule => rules.includes(rule.name)) as RuleDeclaration[])
      .concat(additionalRules)
      .map(parseRule)

    function getOrderPosition(property: TSESTree.ObjectLiteralElement, rule: ParsedRule) {
      const pos = rule.order.findIndex(item => {
        if (item.exact) {
          const name = getPropertyName(property)
          if (name === item.exact) return true
        }
        if (item.pattern) {
          const name = getPropertyName(property)
          if (name && new RegExp(item.pattern).test(String(name))) return true
        }
        if (item.selector) {
          if (esquery.matches(property, item.selector)) return true
        }
        return false
      })
      if (pos === -1) {
        const fallbackIndex = rule.order.findIndex(item => item.matchAll)
        if (fallbackIndex !== -1) return fallbackIndex
      }
      return pos
    }

    function sortObject(obj: TSESTree.ObjectExpression, rule: ParsedRule) {
      const properties = obj.properties
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i]
        const pos = getOrderPosition(property, rule)
        if (pos === -1) continue
        const propertiesAbove = properties.slice(0, i)
        const unorderedProperty = propertiesAbove
          .find(sibling => getOrderPosition(sibling, rule) > getOrderPosition(property, rule))
        if (unorderedProperty) {
          context.report({
            node: property,
            messageId: MESSAGE_ID_DEFAULT,
            data: {
              line: unorderedProperty.loc.start.line,
            },
            *fix(fixer) {
              // TODO: avoid side effects
              const afterComma = code.getTokenAfter(property)!
              const hasAfterComma = afterComma.type === 'Punctuator' && afterComma.value === ','

              const beforeComma = code.getTokenBefore(property)!
              const codeStart = beforeComma.range[1] // to include comments
              const codeEnd = hasAfterComma
                ? afterComma.range[1]
                : property.range[1]

              const removeStart = hasAfterComma ? codeStart : beforeComma.range[0]
              yield fixer.removeRange([removeStart, codeEnd])

              const propertyCode = code.text.slice(codeStart, codeEnd)
                + (hasAfterComma ? '' : ',')
              const insertTarget = code.getTokenBefore(unorderedProperty)!

              yield fixer.insertTextAfter(insertTarget, propertyCode)
            },
          })
        }
      }
    }

    return utils.executeOnVue(context, (obj: TSESTree.ObjectExpression) => {
      for (const expr of getPropertyValues(obj)) {
        const name = utils.getStaticPropertyName(expr.parent)
        if (!name) continue
        for (const rule of allRules) {
          if (rule.key === name) {
            if (rule.type === 'properties') {
              if (expr.type === AST_NODE_TYPES.ObjectExpression) {
                for (const prop of getPropertyValues(expr)) {
                  if (prop.type === AST_NODE_TYPES.ObjectExpression) {
                    sortObject(prop, rule)
                  }
                }
              }
            } else if (rule.type === 'return') {
              if (expr.type === AST_NODE_TYPES.FunctionExpression) {
                const statements: TSESTree.ObjectExpression[] = esquery.query(
                  expr,
                  'ReturnStatement > ObjectExpression',
                )
                for (const statement of statements) {
                  sortObject(statement, rule)
                }
              }
            } else {
              if (expr.type === AST_NODE_TYPES.ObjectExpression) {
                sortObject(expr, rule)
              }
            }
          }
        }
      }
    })
  },
})
