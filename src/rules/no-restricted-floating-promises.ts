import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-restricted-floating-promises'

function isFloatingPromise(node: TSESTree.Node): boolean {
  const parent = node.parent
  if (!parent) return true
  if (parent.type === 'MemberExpression' && parent.parent?.type === 'CallExpression') {
    const method = parent.property
    const call = parent.parent
    if (method.type !== 'Identifier') return false
    if (method.name === 'catch') return false
    if (method.name === 'then' && call.arguments.length > 1) return false
    return isFloatingPromise(call)
  }
  if (parent.type === 'ExpressionStatement') {
    return true
  }
  return false
}

interface RulePattern {
  type?: string,
  selector?: string,
  message?: string,
}

const TYPE_MAPPING: Record<string, RulePattern> = {
  'vuex-action': {
    selector: `CallExpression:matches(${[
      '[callee.name="dispatch"]',
      '[callee.property.name="dispatch"]',
    ].join(',')})`,
    message: 'Vuex actions must be handled',
  },
  'element-message-box': {
    selector: `CallExpression:matches(${[
      '[callee.property.name="$alert"]',
      '[callee.property.name="$confirm"]',
      '[callee.object.property.name="$msgbox"][callee.property.name="alert"]',
      '[callee.object.property.name="$msgbox"][callee.property.name="confirm"]',
      '[callee.object.name="MessageBox"][callee.property.name="alert"]',
      '[callee.object.name="MessageBox"][callee.property.name="confirm"]',
    ].join(',')})`,
    message: 'ElMessageBox methods must be handled',
  },
  'vant-dialog': {
    selector: `CallExpression:matches(${[
      '[callee.object.property.name="$dialog"][callee.property.name="confirm"]',
      '[callee.object.name="Dialog"][callee.property.name="confirm"]',
    ].join(',')})`,
    message: 'Vant Dialog methods must be handled',
  },
}

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce Promises with specified syntax to be handled appropriately',
      recommended: false,
    },
    schema: {
      type: 'array',
      items: {
        anyOf: [
          {
            type: 'string',
          },
          {
            type: 'object',
            properties: {
              type: {
                type: 'string',
              },
              selector: {
                type: 'string',
              },
              message: {
                type: 'string',
              },
            },
            additionalProperties: false,
          },
        ],
      },
    },
    messages: {
      [MESSAGE_ID_DEFAULT]: '{{ message }}',
    },
  },
  defaultOptions: [] as (string | RulePattern)[],
  create(context) {
    return Object.fromEntries(
      context.options.map(selectorOrObject => {
        let pattern = typeof selectorOrObject === 'string'
          ? { selector: selectorOrObject }
          : selectorOrObject
        if (pattern.type) {
          pattern = { ...TYPE_MAPPING[pattern.type], ...pattern }
        }
        const selector = pattern.selector!
        const message = pattern.message ?? `Promises '${selector}' must be handled`

        const ruleFn = (node: TSESTree.Node) => {
          if (isFloatingPromise(node)) {
            context.report({
              node,
              messageId: MESSAGE_ID_DEFAULT,
              data: { message },
            })
          }
        }
        return [selector, ruleFn]
      }),
    )
  },
})
