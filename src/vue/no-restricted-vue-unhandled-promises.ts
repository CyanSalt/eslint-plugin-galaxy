import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { getModuleScope } from '../context'
import { isIdentifierOf } from '../estree'
import type { RulePattern } from '../rules/no-restricted-floating-promises'
import noRestrictedFloatingPromises, { createMatcher, isCaughtByChain, isFloatingPromise, normalizeRulePattern } from '../rules/no-restricted-floating-promises'
import { createRule, createRuleListenerFromEntries } from '../utils'

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

function isCaughtByChainInBlock(node: TSESTree.Node, root: TSESTree.Node | null = null): boolean {
  if (node === root) return false
  if (isCaughtByChain(node)) return true
  if (!node.parent) return false
  return isCaughtByChainInBlock(node.parent, root)
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
  expression: TSESTree.AwaitExpression | TSESTree.ReturnStatement | TSESTree.ArrowFunctionExpression,
  pattern: ReturnType<typeof normalizeRulePattern>,
}

interface MethodReference {
  node: PromiseCause['node'],
  expression: PromiseCause['expression'] | null,
  name: string,
}

interface MethodPromiseReference {
  name: string,
  cause: Pick<PromiseCause, 'pattern'>,
  indirect?: boolean,
}

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce Promises in Vue functions with specified syntax to be handled appropriately',
    },
    schema: noRestrictedFloatingPromises.meta.schema,
    messages: {
      [MESSAGE_ID_DEFAULT]: '{{ message }}',
    },
  },
  defaultOptions: [] as (string | RulePattern)[],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')

    let causes: PromiseCause[] = []

    let methodReferences: MethodReference[] = []
    let templateMethodReferences: MethodReference[] = []
    let scriptSetupMethodReferences: MethodReference[] = []

    let methodPromises: MethodPromiseReference[] = []
    let scriptSetupMethodPromises: MethodPromiseReference[] = []

    const scriptSetupElement = utils.getScriptSetupElement(context)
    let vueObjectExpression: TSESTree.ObjectExpression | null = null

    function checkUnhandledPromise(cause: PromiseCause) {
      const { node, expression, pattern } = cause
      const unhandled = isUnhandledPromise(node, cause)
      if (unhandled) {
        context.report({
          node: typeof unhandled === 'boolean' ? expression : unhandled,
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
    }

    function checkMethodReferences(
      references: MethodReference[],
      promiseReferences: MethodPromiseReference[],
      excludeNames: Set<string> = new Set<string>(),
    ) {
      if (!promiseReferences.length) return
      const checkingPromiseReferences = promiseReferences.reduce<MethodPromiseReference[]>((refs, current) => {
        if (!refs.some(ref => ref.name === current.name && ref.cause.pattern === current.cause.pattern)) {
          refs.push(current)
        }
        return refs
      }, [])
      for (const { name, cause, indirect } of checkingPromiseReferences) {
        excludeNames.add(name)
        const filteredReferences = references.filter(ref => ref.name === name)
        for (const reference of filteredReferences) {
          // Floating promise
          if (!reference.expression) {
            if (!cause.pattern.asyncOnly || indirect) {
              checkFloatingPromise({
                node: reference.node,
                pattern: cause.pattern,
              })
            }
          } else {
            checkUnhandledPromise({
              node: reference.node,
              expression: reference.expression,
              pattern: cause.pattern,
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

    function isDefinedOnComponent(name: string, node: any): boolean {
      if (node.type === 'VElement' && node.variables.some(item => item.id.name === name)) return false
      return node.parent ? isDefinedOnComponent(name, node.parent) : true
    }

    function reportUnhandledPromises() {
      // Ignore variables defined in template
      templateMethodReferences = templateMethodReferences.filter(ref => {
        return isDefinedOnComponent(ref.name, ref.node)
      })
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
    ): boolean | TSESTree.Node {
      // Top-level unhandled promises
      const scope = context.sourceCode.getScope?.(node)
      if (!scope) return true
      const functionScope = getFunctionScope(scope)
      if (!functionScope) return true
      const block = functionScope.block
      // Handled promises
      if (isCaughtByChainInBlock(node, block)) return false
      const catchable = cause.expression.type === AST_NODE_TYPES.AwaitExpression
      if (catchable) {
        const tryStatement = getUpperNode(node, AST_NODE_TYPES.TryStatement, block)
        if (tryStatement) return false
      }

      // Option API
      if (vueObjectExpression) {
        // Lifecycle-unhandled promises
        const lifecycles: TSESTree.Node[] = getLifecyclePropertyValues(vueObjectExpression)
        if (lifecycles.includes(block)) return true
        // Watcher-unhandled promises
        const watchers: TSESTree.Node[] = Array.from(getWatchers(vueObjectExpression).values())
        if (watchers.includes(block)) return true
        // Method-unhandled promises
        const methodName = Array.from(getMethods(vueObjectExpression).entries())
          .find(([name, value]) => value === block)?.[0]
        if (methodName) {
          // Event-unhandled promises
          const reference = templateMethodReferences.find(item => item.name === methodName)
          if (reference) return reference.node
          // Check recursively
          methodPromises.push({ name: methodName, cause, indirect: true })
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
        if (isSetupFunction(block)) return true
        // Method-unhandled promises
        const moduleScope = getModuleScope(context)
        const variableName = moduleScope?.variables
          .find(variable => variable.defs.some(def => def.node === block))?.name
        if (variableName) {
          // Event-unhandled promises
          const reference = templateMethodReferences.find(item => item.name === variableName)
          if (reference) return reference.node
          // Check recursively
          scriptSetupMethodPromises.push({ name: variableName, cause })
        }
      }

      return false
    }

    const templateVisitor = {
      // @click="foo"
      'VAttribute[key.name.name="on"] > VExpressionContainer[expression.type="Identifier"]'(node: TSESTree.Node) {
        const expression: TSESTree.Identifier = node['expression']
        templateMethodReferences.push({
          node: expression,
          expression: null,
          name: expression.name,
        })
      },
      // @click="foo()"
      'VOnExpression CallExpression[callee.type="Identifier"]'(
        node: TSESTree.CallExpression & { callee: TSESTree.Identifier },
      ) {
        templateMethodReferences.push({
          node,
          expression: null,
          name: node.callee.name,
        })
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
      createRuleListenerFromEntries(
        context.options.map(normalizeRulePattern).flatMap(pattern => {
          const matches = createMatcher(context, pattern)
          const entries: [string, TSESLint.RuleFunction][] = [
            [`AwaitExpression ${pattern.selector}`, (node: TSESTree.Node) => {
              if (!matches(node)) return
              causes.push({
                node,
                expression: getUpperNode(node, AST_NODE_TYPES.AwaitExpression)!,
                pattern,
              })
            }],
            [`ReturnStatement ${pattern.selector}`, (node: TSESTree.Node) => {
              if (!matches(node)) return
              const expression = getUpperNode(node, AST_NODE_TYPES.ReturnStatement)!
              const nesting = getUpperNode(node, AST_NODE_TYPES.AwaitExpression, expression)
              if (nesting) return
              causes.push({
                node,
                expression,
                pattern,
              })
            }],
            [`ArrowFunctionExpression > ${pattern.selector}`, (node: TSESTree.Node) => {
              if (!matches(node)) return
              const expression = node.parent as TSESTree.ArrowFunctionExpression
              causes.push({
                node,
                expression,
                pattern,
              })
            }],
          ]
          if (pattern.vuePropertySelector) {
            entries.push([
              pattern.vuePropertySelector,
              (node: TSESTree.Literal | TSESTree.Property) => {
                if (node.type === AST_NODE_TYPES.Property) {
                  if (node.key.type === AST_NODE_TYPES.Identifier) {
                    methodPromises.push({
                      name: node.key.name,
                      cause: { pattern },
                    })
                  }
                } else {
                  if (typeof node.value === 'string') {
                    methodPromises.push({
                      name: node.value,
                      cause: { pattern },
                    })
                  }
                }
              },
            ])
          }
          return entries
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
