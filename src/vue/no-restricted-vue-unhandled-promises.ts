import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { getModuleScope } from '../context'
import { isIdentifierOf } from '../estree'
import type { RulePattern } from '../rules/no-restricted-floating-promises'
import noRestrictedFloatingPromises, { createPathsMatcher, normalizeRulePattern } from '../rules/no-restricted-floating-promises'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-restricted-vue-unhandled-promises'

const LIFECYCLE_HOOKS = [
  // builtin
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'activated',
  'deactivated',
  'beforeUnmount',
  'unmounted',
  'beforeDestroy',
  'destroyed',
  'renderTracked',
  'renderTriggered',
  'errorCaptured',
  // vue-router
  'beforeRouteEnter',
  'beforeRouteUpdate',
  'beforeRouteLeave',
]

const SETUP_FUNCTIONS = [
  // builtin
  // lifecycle hooks
  'onBeforeMount',
  'onMounted',
  'onBeforeUpdate',
  'onUpdated',
  'onActivated',
  'onDeactivated',
  'onBeforeUnmount',
  'onUnmounted',
  'onRenderTracked',
  'onRenderTriggered',
  'onErrorCaptured',
  'onServerPrefetch',
  // reactivity
  'watchEffect',
  'watchPostEffect',
  'watchSyncEffect',
  'watch',
  // vue-router
  'onBeforeRouteUpdate',
  'onBeforeRouteLeave',
]

function getCurrentScope(node: TSESTree.Node, manager: TSESLint.Scope.ScopeManager): TSESLint.Scope.Scope | null {
  const scope = manager.acquire(node)
  if (scope) return scope
  return node.parent ? getCurrentScope(node.parent, manager) : null
}

function getFunctionScope(scope: TSESLint.Scope.Scope | null): TSESLint.Scope.Scope | null {
  return !scope || scope.type === 'function'
    ? scope
    : getFunctionScope(scope.upper)
}

function getTryStatementBetween(node: TSESTree.Node, upperNode: TSESTree.Node): TSESTree.TryStatement | null {
  if (node.type === AST_NODE_TYPES.TryStatement) return node
  if (!node.parent || node === upperNode) return null
  return getTryStatementBetween(node.parent, upperNode)
}

function getPropertyValue(node: TSESTree.ObjectExpression, name: string): TSESTree.Node | undefined {
  for (const item of node.properties) {
    if (item.type === AST_NODE_TYPES.Property && isIdentifierOf(item.key, name)) {
      return item.value
    }
  }
}

function getLifecyclePropertyValues(node: TSESTree.ObjectExpression) {
  return LIFECYCLE_HOOKS
    .map(name => getPropertyValue(node, name))
    .filter((item): item is TSESTree.Property['value'] => Boolean(item))
}

const methodsCache = new Map<TSESTree.ObjectExpression, Map<string, TSESTree.Node>>()
const watchersCache = new Map<TSESTree.ObjectExpression, Map<string, TSESTree.Node>>()

function getMethods(node: TSESTree.ObjectExpression) {
  if (methodsCache.has(node)) return methodsCache.get(node)!
  const methods = new Map<string, TSESTree.Node>()
  const methodsObject = getPropertyValue(node, 'methods')
  if (methodsObject && methodsObject.type === AST_NODE_TYPES.ObjectExpression) {
    for (const item of methodsObject.properties) {
      if (
        item.type === AST_NODE_TYPES.Property
        && item.key.type === AST_NODE_TYPES.Identifier
      ) {
        methods.set(item.key.name, item.value)
      }
    }
  }
  methodsCache.set(node, methods)
  return methods
}

function getWatchers(node: TSESTree.ObjectExpression) {
  if (watchersCache.has(node)) return watchersCache.get(node)!
  const watchers = new Map<string, TSESTree.Node>()
  const watcherObject = getPropertyValue(node, 'watch')
  if (watcherObject && watcherObject.type === AST_NODE_TYPES.ObjectExpression) {
    for (const item of watcherObject.properties) {
      if (
        item.type === AST_NODE_TYPES.Property
        && item.key.type === AST_NODE_TYPES.Identifier
      ) {
        const name = item.key.name
        const value = item.value
        if (value.type === AST_NODE_TYPES.Literal) {
          const methods = getMethods(node)
          if (methods.has(name)) {
            watchers.set(name, methods.get(name)!)
          }
        } else if (value.type === AST_NODE_TYPES.ObjectExpression) {
          const handler = getPropertyValue(value, 'handler')
          if (handler && handler.type === AST_NODE_TYPES.FunctionExpression) {
            watchers.set(name, handler)
          }
        } else {
          watchers.set(name, value)
        }
      }
    }
  }
  watchersCache.set(node, watchers)
  return watchers
}

function isSetupFunction(node: TSESTree.Node) {
  const parent = node.parent
  return Boolean(
    parent
    && parent.type === AST_NODE_TYPES.CallExpression
    && parent.callee.type === AST_NODE_TYPES.Identifier
    && SETUP_FUNCTIONS.includes(parent.callee.name),
  )
}

function isInside(node: TSESTree.Node, container: TSESTree.Node) {
  return container.range[0] <= node.range[0] && node.range[1] <= container.range[1]
}

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce Promises in Vue functions with specified syntax to be handled appropriately',
      recommended: false,
    },
    schema: noRestrictedFloatingPromises.meta.schema,
    messages: {
      [MESSAGE_ID_DEFAULT]: '{{ message }}',
    },
  },
  defaultOptions: [] as (string | RulePattern)[],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')

    const code = context.getSourceCode()
    const scopeManager = code.scopeManager!

    let promiseExpressions: {
      node: TSESTree.Node,
      pattern: ReturnType<typeof normalizeRulePattern>,
    }[] = []

    let templateEventListenerNames: string[] = []

    const scriptSetupElement = utils.getScriptSetupElement(context)
    let vueObjectExpression: TSESTree.ObjectExpression | null = null

    function reportUnhandledPromises() {
      for (const { node, pattern } of promiseExpressions) {
        const matches = createPathsMatcher(context, pattern)
        if (matches(node) && isUnhandledPromise(node)) {
          context.report({
            node,
            messageId: MESSAGE_ID_DEFAULT,
            data: {
              message: pattern.message,
            },
          })
        }
      }
      if (vueObjectExpression) {
        methodsCache.delete(vueObjectExpression)
        watchersCache.delete(vueObjectExpression)
      }
    }

    function isUnhandledPromise(node: TSESTree.Node): boolean {
      // Top-level unhandled promises
      const scope = getCurrentScope(node, scopeManager)
      if (!scope) return true
      const functionScope = getFunctionScope(scope)
      if (!functionScope) return true
      const block = functionScope.block
      // Handled promises
      const tryStatement = getTryStatementBetween(node, block)
      if (tryStatement) return false

      // Option API
      if (vueObjectExpression) {
        // Lifecycle-unhandled promises
        const lifecycles: TSESTree.Node[] = getLifecyclePropertyValues(vueObjectExpression)
        // TODO: also check methods without
        if (lifecycles.includes(block)) return true
        // Watcher-unhandled promises
        const watchers: TSESTree.Node[] = Array.from(getWatchers(vueObjectExpression).values())
        if (watchers.includes(block)) return true
        // Event-unhandled promises
        const methods: TSESTree.Node[] = Array.from(getMethods(vueObjectExpression).entries())
          .filter(([name, value]) => templateEventListenerNames.includes(name))
          .map(([name, value]) => value)
        if (methods.includes(block)) return true
        // Setup in options API
        const setup = getPropertyValue(vueObjectExpression, 'setup')
        if (setup && isInside(block, setup)) {
          // Lifecycle-unhandled or reactivity-unhandled promises
          if (isSetupFunction(block)) return true
          // TODO: return value of setup referenced by event listeners
        }
      }

      // Composition API
      if (scriptSetupElement && isInside(block, scriptSetupElement)) {
        // Lifecycle-unhandled or reactivity-unhandled promises
        // TODO: also check functions
        if (isSetupFunction(block)) return true
        // Event-unhandled promises
        const moduleScope = getModuleScope(context)
        const variables = moduleScope
          ? moduleScope.variables.filter(variable => templateEventListenerNames.includes(variable.name))
          : []
        if (variables.some(variable => variable.defs.some(def => def.node === block))) return true
      }

      return false
    }

    const templateVisitor = {
      'VAttribute[key.name.name="on"] > VExpressionContainer'(node: TSESTree.Node) {
        const expression: TSESTree.Expression = node['expression']
        if (expression.type === AST_NODE_TYPES.Identifier) {
          // TODO: identifiers from v-slot, etc.
          templateEventListenerNames.push(expression.name)
        }
      },
      'VElement[parent.type!=\'VElement\']:exit'() {
        reportUnhandledPromises()
      },
    }

    const scriptVisitor = utils.compositingVisitors(
      utils.defineVueVisitor(context, {
        onVueObjectEnter(node: TSESTree.ObjectExpression) {
          vueObjectExpression = node
        },
      }),
      Object.fromEntries(
        context.options.map(normalizeRulePattern).map(pattern => {
          const selector = `AwaitExpression ${pattern.selector}`
          const ruleFn = (node: TSESTree.Node) => {
            promiseExpressions.push({ node, pattern })
          }
          return [selector, ruleFn]
        }),
      ),
      {
        'Program:exit'(node: TSESTree.Program) {
          if (!node['templateBody']) {
            reportUnhandledPromises()
          }
        },
      },
    )

    return utils.defineTemplateBodyVisitor(
      context,
      templateVisitor,
      scriptVisitor,
    )
  },
})
