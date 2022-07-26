import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { ArrayOrObjectElement } from '../fixer'
import { removeElement } from '../fixer'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-unused-vuex-properties'
const MESSAGE_ID_SUGGESTION_REMOVE = 'suggestion@no-unused-vuex-properties.remove'

const mappingFunctions = [
  'mapState',
  'mapGetters',
  'mapMutations',
  'mapActions',
]

function getMappingSelector(functions: string[]) {
  return [
    'CallExpression',
    `:matches(${functions.map(fn => `[callee.name="${fn}"]`).join(',')})`,
    '[arguments]',
  ].join('')
}

function getReferences(references: any[]) {
  return references.filter((ref) => ref.variable === undefined || ref.variable === null)
    .map((ref) => ref.id)
}

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow unused properties from Vuex',
      recommended: 'error',
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Property "{{name}}" is never used.',
      [MESSAGE_ID_SUGGESTION_REMOVE]: 'Remove unused property',
    },
  },
  defaultOptions: [],
  create(context) {
    const utils = require('eslint-plugin-vue/lib/utils')
    const {
      definePropertyReferenceExtractor,
      mergePropertyReferences,
    } = require('eslint-plugin-vue/lib/utils/property-references')
    const { getStyleVariablesContext } = require('eslint-plugin-vue/lib/utils/style-variables')

    const code = context.getSourceCode()

    const propertyReferenceExtractor = definePropertyReferenceExtractor(context)

    const container = {
      properties: [] as { name: string, node: ArrayOrObjectElement }[],
      propertyReferences: [] as string[],
    }

    const templatePropertiesContainer: any = {
      propertyReferences: [],
    }

    function getParentProperty(node: TSESTree.Expression) {
      if (
        !node.parent
        || node.parent.type !== AST_NODE_TYPES.Property
        || node.parent.value !== node
      ) {
        return null
      }
      const property = node.parent
      if (!utils.isProperty(property)) {
        return null
      }
      return property
    }

    function reportUnusedProperties() {
      const propertyReferences = mergePropertyReferences([
        ...container.propertyReferences,
        ...templatePropertiesContainer.propertyReferences,
      ])

      for (const property of container.properties) {
        if (propertyReferences.hasProperty(property.name)) {
          continue
        }
        context.report({
          node: property.node,
          messageId: MESSAGE_ID_DEFAULT,
          data: {
            name: property.name,
          },
          suggest: [
            {
              messageId: MESSAGE_ID_SUGGESTION_REMOVE,
              fix(fixer) {
                return removeElement(code, fixer, property.node)
              },
            },
          ],
        })
      }
    }

    const mappingSelector = getMappingSelector(mappingFunctions)

    const scriptVisitor = utils.compositingVisitors(
      {
        [`${mappingSelector} > ObjectExpression > Property`](node: TSESTree.Property) {
          container.properties.push({
            name: node.key.type === AST_NODE_TYPES.Identifier
              ? node.key.name
              : (node.key as TSESTree.StringLiteral).value,
            node,
          })
        },
        [`${mappingSelector} > ArrayExpression > Literal`](node: TSESTree.StringLiteral) {
          container.properties.push({
            name: node.value,
            node,
          })
        },
      },
      utils.defineVueVisitor(context, {
        onVueObjectEnter(node) {
          for (const watcher of utils.iterateProperties(node, new Set(['watch']))) {
            // Process `watch: { foo /* <- this */ () {} }`
            container.propertyReferences.push(
              propertyReferenceExtractor.extractFromPath(
                watcher.name,
                watcher.node,
              ),
            )
            // Process `watch: { x: 'foo' /* <- this */  }`
            if (watcher.type === 'object') {
              const property = watcher.property
              if (property.kind === 'init') {
                for (const handlerValueNode of utils.iterateWatchHandlerValues(
                  property,
                )) {
                  if (
                    handlerValueNode.type === AST_NODE_TYPES.Literal
                    || handlerValueNode.type === AST_NODE_TYPES.TemplateLiteral
                  ) {
                    const name = utils.getStringLiteralValue(handlerValueNode)
                    if (name !== undefined && name !== null) {
                      container.propertyReferences.push(
                        propertyReferenceExtractor.extractFromName(name),
                      )
                    }
                  }
                }
              }
            }
          }
        },
        'ObjectExpression > Property > :function[params.length>0]'(
          node: (TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression) & { parent: TSESTree.Property },
          vueData,
        ) {
          const property = getParentProperty(node)
          if (!property) {
            return
          }
          if (property.parent === vueData.node) {
            if (utils.getStaticPropertyName(property) !== 'data') {
              return
            }
            // check { data: (vm) => vm.prop }
          } else {
            const parentProperty = getParentProperty(property.parent as TSESTree.Expression)
            if (!parentProperty) {
              return
            }
            if (parentProperty.parent === vueData.node) {
              if (utils.getStaticPropertyName(parentProperty) !== 'computed') {
                return
              }
              // check { computed: { foo: (vm) => vm.prop } }
            } else {
              const parentParentProperty = getParentProperty(
                parentProperty.parent as TSESTree.Expression,
              )
              if (!parentParentProperty) return
              if (parentParentProperty.parent === vueData.node) {
                if (
                  utils.getStaticPropertyName(parentParentProperty)
                    !== 'computed'
                  || utils.getStaticPropertyName(property) !== 'get'
                ) {
                  return
                }
                // check { computed: { foo: { get: (vm) => vm.prop } } }
              } else {
                return
              }
            }
          }
          const propertyReferences = propertyReferenceExtractor.extractFromFunctionParam(node, 0)
          container.propertyReferences.push(propertyReferences)
        },
        'ThisExpression, Identifier'(node: TSESTree.ThisExpression | TSESTree.Identifier) {
          if (!utils.isThis(node, context)) return
          const propertyReferences = propertyReferenceExtractor.extractFromExpression(node, false)
          container.propertyReferences.push(propertyReferences)
        },
      }),
      {
        'Program:exit'(node: TSESTree.Program) {
          const styleVars = getStyleVariablesContext(context)
          if (styleVars) {
            for (const { id } of styleVars.references) {
              templatePropertiesContainer.propertyReferences.push(
                propertyReferenceExtractor.extractFromName(
                  id.name,
                  () => propertyReferenceExtractor.extractFromExpression(id, true),
                ),
              )
            }
          }
          if (!node['templateBody']) {
            reportUnusedProperties()
          }
        },
      },
    )

    const templateVisitor = {
      VExpressionContainer(node) {
        for (const id of getReferences(node.references)) {
          templatePropertiesContainer.propertyReferences.push(
            propertyReferenceExtractor.extractFromName(
              id.name,
              () => propertyReferenceExtractor.extractFromExpression(id, true),
            ),
          )
        }
      },
      'VElement[parent.type!=\'VElement\']:exit'() {
        reportUnusedProperties()
      },
    }

    return utils.defineTemplateBodyVisitor(
      context,
      templateVisitor,
      scriptVisitor,
    )
  },
})
