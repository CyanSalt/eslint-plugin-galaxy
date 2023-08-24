import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { isIdentifierProperty } from '../estree'
import { removeTrailingComma } from '../fixer'
import { createRule } from '../utils'
import { MAPPING_FUNCTIONS } from './no-unused-vuex-properties'

const MESSAGE_ID_DEFAULT = 'no-duplicate-vuex-properties'
const MESSAGE_ID_SUGGESTION_REMOVE = 'suggestion@no-duplicate-vuex-properties.remove'

const SELECTOR = `ObjectExpression > SpreadElement > CallExpression:matches(${
  MAPPING_FUNCTIONS.map(name => `[callee.name="${name}"]`).join(', ')
})`

type VuexCallExpression = TSESTree.CallExpression & {
  parent: TSESTree.SpreadElement & {
    parent: TSESTree.ObjectExpression,
  },
}

function addValueToSetMap<T, U>(map: Map<T, Set<U>>, key: T, value: U) {
  let values: Set<U>
  if (map.has(key)) {
    values = map.get(key)!
  } else {
    values = new Set()
    map.set(key, values)
  }
  values.add(value)
}

export default createRule({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow duplicate properties from Vuex',
      recommended: 'recommended',
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Duplicate property "{{ name }}" on line {{ line }}.',
      [MESSAGE_ID_SUGGESTION_REMOVE]: 'Remove duplicate property',
    },
  },
  defaultOptions: [],
  create(context) {
    const code = context.getSourceCode()
    const vuexCalls = new Map<TSESTree.ObjectExpression, Set<VuexCallExpression>>()

    return {
      [SELECTOR](node: VuexCallExpression) {
        const propertyTarget = node.parent.parent
        addValueToSetMap(vuexCalls, propertyTarget, node)
      },
      'Program:exit'() {
        for (const [expr, callSet] of vuexCalls) {
          let mappedProperties = new Map<string, Set<TSESTree.Node>>()
          for (const property of expr.properties) {
            if (isIdentifierProperty(property)) {
              addValueToSetMap(mappedProperties, property.key.name, property.key)
            }
          }
          for (const call of callSet) {
            const propertyMapping = call.arguments.find(arg => {
              return arg.type === AST_NODE_TYPES.ArrayExpression
                || arg.type === AST_NODE_TYPES.ObjectExpression
            })
            if (propertyMapping?.type === AST_NODE_TYPES.ArrayExpression) {
              for (const element of propertyMapping.elements) {
                if (element?.type === AST_NODE_TYPES.Literal && typeof element.value === 'string') {
                  addValueToSetMap(mappedProperties, element.value, element)
                }
              }
            }
          }
          for (const [name, propertySet] of mappedProperties) {
            if (propertySet.size > 1) {
              const properties = Array.from(propertySet)
              const line = properties[0].loc.start.line
              properties.slice(1)
                .forEach(propertyNode => {
                  context.report({
                    node: propertyNode,
                    messageId: MESSAGE_ID_DEFAULT,
                    data: {
                      name,
                      line,
                    },
                    suggest: [
                      {
                        messageId: MESSAGE_ID_SUGGESTION_REMOVE,
                        *fix(fixer) {
                          yield* removeTrailingComma(code, fixer, propertyNode)
                          yield fixer.remove(propertyNode)
                        },
                      },
                    ],
                  })
                })
            }
          }
        }
      },
    }
  },
})
