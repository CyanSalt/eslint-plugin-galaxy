import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import ignore from 'ignore'
import { isMemberExpressionOf, iterateNodeFactory } from '../estree'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-restricted-floating-promises'

export function isCaughtByChain(node: TSESTree.Node): boolean {
  const parent = node.parent
  if (!parent) return false
  if (parent.type === AST_NODE_TYPES.MemberExpression && parent.parent?.type === AST_NODE_TYPES.CallExpression) {
    const method = parent.property
    const call = parent.parent
    if (method.type !== AST_NODE_TYPES.Identifier) return true
    if (method.name === 'catch') return true
    if (method.name === 'then' && call.arguments.length > 1) return true
    return isCaughtByChain(call)
  }
  return false
}

function getHighOrderPromise(node: TSESTree.Node) {
  // Promise Aggregation
  if (node.type === AST_NODE_TYPES.ArrayExpression) {
    const parent = node.parent
    if (
      parent
      && parent.type === AST_NODE_TYPES.CallExpression
      && isMemberExpressionOf(parent.callee, 'Promise', ['all', 'any', 'race'])
    ) {
      return parent
    }
  }
  // Promise Wrapper
  if (node.type === AST_NODE_TYPES.CallExpression) {
    if (isMemberExpressionOf(node.callee, 'Promise', ['reject', 'resolve'])) {
      return node
    }
  }
  return null
}

export function isFloatingPromise(node: TSESTree.Node): boolean {
  const parent = node.parent
  if (!parent) return true
  if (parent.type === AST_NODE_TYPES.MemberExpression && parent.parent?.type === AST_NODE_TYPES.CallExpression) {
    if (isCaughtByChain(node)) return false
    const call = parent.parent
    return isFloatingPromise(call)
  }
  if (parent.type === AST_NODE_TYPES.ExpressionStatement) {
    return true
  }
  const upper = getHighOrderPromise(parent)
  if (upper) {
    return isFloatingPromise(upper)
  }
  return false
}

export interface RulePattern {
  type?: string,
  selector?: string,
  names?: string[],
  paths?: string[],
  message?: string,
  // for `no-restricted-vue-unhandled-promises`
  vuePropertySelector?: string,
  asyncOnly?: boolean,
}

const TYPE_MAPPING: Record<string, RulePattern> = {
  'vue-store-action': {
    selector: ':not(*)',
    vuePropertySelector: [
      'CallExpression[callee.name="mapActions"] > ArrayExpression > Literal',
      'CallExpression[callee.name="mapActions"] > ObjectExpression > Property',
    ].join(', '),
    message: 'Store actions must be handled',
  },
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
    message: 'ElementUI MessageBox methods must be handled',
  },
  'vant-dialog': {
    selector: `CallExpression:matches(${[
      '[callee.object.property.name="$dialog"][callee.property.name="confirm"]',
      '[callee.object.name="Dialog"][callee.property.name="confirm"]',
    ].join(',')})`,
    message: 'Vant Dialog methods must be handled',
  },
}

type MarkRequired<T, U extends keyof T> = Omit<T, U> & Required<Pick<T, U>>

type NormalizedRulePattern = MarkRequired<RulePattern, 'selector' | 'message'>

export function normalizeRulePattern(selectorOrObject: string | RulePattern): NormalizedRulePattern {
  let pattern = typeof selectorOrObject === 'string'
    ? { selector: selectorOrObject }
    : selectorOrObject
  if (pattern.type) {
    pattern = { ...TYPE_MAPPING[pattern.type], ...pattern }
  }
  const selector = pattern.selector ?? 'CallExpression'
  let message: string
  if (pattern.message) {
    message = pattern.message
  } else if (pattern.names) {
    message = `Promises created from ${pattern.names.map(str => `'${str}'`).join(', ')} must be handled`
  } else if (pattern.paths) {
    message = `Promises created from ${pattern.paths.map(str => `'${str}'`).join(', ')} must be handled`
  } else {
    message = `Promises '${selector}' must be handled`
  }
  return {
    ...pattern,
    selector,
    message,
  }
}

export function createMatcher(
  context: TSESLint.RuleContext<string, unknown[]>,
  pattern: NormalizedRulePattern,
) {
  const names = pattern.names
  const pathMatcher = pattern.paths
    ? ignore({ allowRelativePaths: true }).add(pattern.paths)
    : undefined
  return function (node: TSESTree.Node) {
    if (pathMatcher || names) {
      const scope = context.getScope()
      for (const item of iterateNodeFactory(node, scope)) {
        if (item.type === AST_NODE_TYPES.Identifier) {
          if (names?.includes(item.name)) return true
        }
        if (item.type === AST_NODE_TYPES.ImportDeclaration) {
          const source = item.source
          if (pathMatcher?.ignores(source.value)) return true
        }
      }
      return false
    }
    return true
  }
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
              names: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              paths: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              message: {
                type: 'string',
              },
              vuePropertySelector: {
                type: 'string',
              },
              asyncOnly: {
                type: 'boolean',
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
      context.options.map(normalizeRulePattern).map(pattern => {
        const matches = createMatcher(context, pattern)
        const ruleFn = (node: TSESTree.Node) => {
          if (!matches(node)) return
          if (isFloatingPromise(node)) {
            context.report({
              node,
              messageId: MESSAGE_ID_DEFAULT,
              data: {
                message: pattern.message,
              },
            })
          }
        }
        return [pattern.selector, ruleFn]
      }),
    )
  },
})
