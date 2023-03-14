import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import ignore from 'ignore'
import { getModuleScope } from '../context'
import { getImportSource } from '../estree'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-restricted-floating-promises'

function isFloatingPromise(node: TSESTree.Node): boolean {
  const parent = node.parent
  if (!parent) return true
  if (parent.type === AST_NODE_TYPES.MemberExpression && parent.parent?.type === AST_NODE_TYPES.CallExpression) {
    const method = parent.property
    const call = parent.parent
    if (method.type !== AST_NODE_TYPES.Identifier) return false
    if (method.name === 'catch') return false
    if (method.name === 'then' && call.arguments.length > 1) return false
    return isFloatingPromise(call)
  }
  if (parent.type === AST_NODE_TYPES.ExpressionStatement) {
    return true
  }
  return false
}

export interface RulePattern {
  type?: string,
  selector?: string,
  paths?: string[],
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

type NormalizedRulePattern = MarkRequired<Omit<RulePattern, 'type'>, 'selector' | 'message'>

export function normalizeRulePattern(selectorOrObject: string | RulePattern): NormalizedRulePattern {
  let pattern = typeof selectorOrObject === 'string'
    ? { selector: selectorOrObject }
    : selectorOrObject
  if (pattern.type) {
    pattern = { ...TYPE_MAPPING[pattern.type], ...pattern }
  }
  if (pattern.paths) {
    pattern = { selector: 'CallExpression[callee.type="Identifier"]', ...pattern }
  }
  const selector = pattern.selector!
  const message = pattern.message ?? (
    pattern.paths
      ? `Promises created from '${pattern.paths}' must be handled`
      : `Promises '${pattern.selector}' must be handled`
  )
  return {
    paths: pattern.paths,
    selector,
    message,
  }
}

export function createPathsMatcher(
  context: TSESLint.RuleContext<string, unknown[]>,
  pattern: NormalizedRulePattern,
) {
  const matcher = pattern.paths
    ? ignore({ allowRelativePaths: true }).add(pattern.paths)
    : undefined
  return function (node: TSESTree.Node) {
    if (matcher) {
      const callee = (node as TSESTree.CallExpression).callee as TSESTree.Identifier
      const scope = getModuleScope(context)
      if (!scope) return false
      const source = getImportSource(callee.name, scope)
      if (!source || !matcher.ignores(source)) return false
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
              paths: {
                type: 'array',
                items: {
                  type: 'string',
                },
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
      context.options.map(normalizeRulePattern).map(pattern => {
        const matches = createPathsMatcher(context, pattern)
        const ruleFn = (node: TSESTree.Node) => {
          if (matches(node) && isFloatingPromise(node)) {
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
