import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { getModuleScope } from '../context'
import { isIdentifierOf } from '../estree'
import type { RulePattern } from '../rules/no-restricted-floating-promises'
import noRestrictedFloatingPromises, { isFloatingPromise, isCaughtByChain, createPathsMatcher, normalizeRulePattern } from '../rules/no-restricted-floating-promises'
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

function getUpperNode<T extends TSESTree.Node['type']>(
  node: TSESTree.Node,
  type: T,
  root: TSESTree.Node | null = null,
): Extract<TSESTree.Node, { type: T }> | null {
  if (node.type === type) return node as Extract<TSESTree.Node, { type: T }>
  if (!node.parent || node === root) return null
  return getUpperNode(node.parent, type, root)
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

interface VueMethodCallExpression extends TSESTree.CallExpression {
  callee: TSESTree.MemberExpression & { property: TSESTree.Identifier },
}

interface VueScriptSetupMethodCallExpression extends TSESTree.CallExpression {
  callee: TSESTree.Identifier,
}

const VUE_METHOD_CALL = `CallExpression[callee.property.type="Identifier"]:matches(${[
  '[callee.object.type="ThisExpression"]',
  '[callee.object.type="Identifier"]',
].join(',')})`

const VUE_SCRIPT_SETUP_METHOD_CALL = 'CallExpression[callee.type="Identifier"]'

interface PromiseCause {
  node: TSESTree.Node,
  expression: TSESTree.AwaitExpression | TSESTree.ReturnStatement,
  pattern: ReturnType<typeof normalizeRulePattern>,
  ignorePaths?: boolean,
}

interface MethodReference {
  node: PromiseCause['node'],
  expression: PromiseCause['expression'] | null,
  name: string,
}

interface MethodPromiseReference {
  name: string,
  cause: PromiseCause,
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

    let causes: PromiseCause[] = []

    let methodReferences: MethodReference[] = []
    let scriptSetupMethodReferences: MethodReference[] = []

    let templateEventListenerNames = new Set<string>()

    let methodPromises: MethodPromiseReference[] = []
    let scriptSetupMethodPromises: MethodPromiseReference[] = []

    const scriptSetupElement = utils.getScriptSetupElement(context)
    let vueObjectExpression: TSESTree.ObjectExpression | null = null

    function checkUnhandledPromise(cause: PromiseCause) {
      const { node, expression, pattern, ignorePaths } = cause
      if (!ignorePaths) {
        const matches = createPathsMatcher(context, pattern)
        if (!matches(node)) return
      }
      if (isUnhandledPromise(node, cause, expression.type === AST_NODE_TYPES.AwaitExpression)) {
        context.report({
          node: expression,
          messageId: MESSAGE_ID_DEFAULT,
          data: {
            message: pattern.message,
          },
        })
      }
    }

    function checkFloatingPromise(cause: Omit<PromiseCause, 'expression'>) {
      const { node, pattern } = cause
      if (isFloatingPromise(node)) {
        context.report({
          node,
          messageId: MESSAGE_ID_DEFAULT,
          data: {
            message: pattern.message,
          },
        })
      }
      return
    }

    function checkMethodReferences(
      references: MethodReference[],
      promiseReferences: MethodPromiseReference[],
      excludeNames: Set<string> = new Set<string>(),
    ) {
      if (!promiseReferences.length) return
      const checkingMethodPromises = [...promiseReferences]
      for (const { name, cause } of checkingMethodPromises) {
        excludeNames.add(name)
        const filteredReferences = references.filter(ref => ref.name === name)
        for (const reference of filteredReferences) {
          // Floating promise
          if (!reference.expression) {
            checkFloatingPromise({
              node: reference.node,
              pattern: cause.pattern,
            })
          } else {
            checkUnhandledPromise({
              node: reference.node,
              expression: reference.expression,
              pattern: cause.pattern,
              // Ignore import source matching
              ignorePaths: true,
            })
          }
        }
      }
      // Get differences
      checkMethodReferences(
        references,
        promiseReferences.filter(item => !excludeNames.has(item.name)),
        excludeNames,
      )
    }

    function reportUnhandledPromises() {
      for (const cause of causes) {
        checkUnhandledPromise(cause)
      }
      checkMethodReferences(methodReferences, methodPromises)
      checkMethodReferences(scriptSetupMethodReferences, scriptSetupMethodPromises)
      if (vueObjectExpression) {
        methodsCache.delete(vueObjectExpression)
        watchersCache.delete(vueObjectExpression)
      }
    }

    function isUnhandledPromise(
      node: TSESTree.Node,
      cause: PromiseCause,
      catchable: boolean,
    ): boolean {
      // Top-level unhandled promises
      const scope = getCurrentScope(node, scopeManager)
      if (!scope) return true
      const functionScope = getFunctionScope(scope)
      if (!functionScope) return true
      const block = functionScope.block
      // Handled promises
      if (isCaughtByChain(node)) return false
      if (catchable) {
        const tryStatement = getUpperNode(node, AST_NODE_TYPES.TryStatement, block)
        if (tryStatement) return false
      }

      // Option API
      if (vueObjectExpression) {
        // Lifecycle-unhandled promises
        const lifecycles: TSESTree.Node[] = getLifecyclePropertyValues(vueObjectExpression)
        // TODO: also check methods without
        if (lifecycles.includes(block)) return true
        // Watcher-unhandled promises
        const watchers: TSESTree.Node[] = Array.from(getWatchers(vueObjectExpression).values())
        if (watchers.includes(block)) return true
        // Method-unhandled promises
        const methodName = Array.from(getMethods(vueObjectExpression).entries())
          .find(([name, value]) => value === block)?.[0]
        if (methodName) {
          // Event-unhandled promises
          if (templateEventListenerNames.has(methodName)) return true
          // Check recursively
          methodPromises.push({ name: methodName, cause })
        }
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
        // Method-unhandled promises
        const moduleScope = getModuleScope(context)
        const variableName = moduleScope?.variables
          .find(variable => variable.defs.some(def => def.node === block))?.name
        if (variableName) {
          // Event-unhandled promises
          if (templateEventListenerNames.has(variableName)) return true
          // Check recursively
          scriptSetupMethodPromises.push({ name: variableName, cause })
        }
      }

      return false
    }

    const templateVisitor = {
      'VAttribute[key.name.name="on"] > VExpressionContainer'(node: TSESTree.Node) {
        const expression: TSESTree.Expression = node['expression']
        if (expression.type === AST_NODE_TYPES.Identifier) {
          // TODO: identifiers from v-slot, etc.
          templateEventListenerNames.add(expression.name)
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
        [VUE_METHOD_CALL](node: VueMethodCallExpression) {
          const object = node.callee.object
          if (!utils.isThis(object, context)) return
          const statement = getUpperNode(node, AST_NODE_TYPES.ReturnStatement)
          const expression = getUpperNode(node, AST_NODE_TYPES.AwaitExpression, statement)
          methodReferences.push({
            node,
            expression: expression ?? statement,
            name: node.callee.property.name,
          })
        },
      }),
      utils.defineScriptSetupVisitor(context, {
        [VUE_SCRIPT_SETUP_METHOD_CALL](node: VueScriptSetupMethodCallExpression) {
          const statement = getUpperNode(node, AST_NODE_TYPES.ReturnStatement)
          const expression = getUpperNode(node, AST_NODE_TYPES.AwaitExpression, statement)
          scriptSetupMethodReferences.push({
            node,
            expression: expression ?? statement,
            name: node.callee.name,
          })
        },
      }),
      Object.fromEntries(
        context.options.map(normalizeRulePattern).flatMap(pattern => {
          return [
            [`AwaitExpression ${pattern.selector}`, (node: TSESTree.Node) => {
              causes.push({
                node,
                expression: getUpperNode(node, AST_NODE_TYPES.AwaitExpression)!,
                pattern,
              })
            }],
            [`ReturnStatement ${pattern.selector}`, (node: TSESTree.Node) => {
              const expression = getUpperNode(node, AST_NODE_TYPES.ReturnStatement)!
              const nesting = getUpperNode(node, AST_NODE_TYPES.AwaitExpression, expression)
              if (nesting) return
              causes.push({
                node,
                expression,
                pattern,
              })
            }],
          ]
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