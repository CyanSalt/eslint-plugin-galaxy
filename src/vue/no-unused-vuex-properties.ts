import type { TSESTree } from '@typescript-eslint/experimental-utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-unused-vuex-properties'

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
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Property "{{name}}" is never used.',
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

    const propertyReferenceExtractor = definePropertyReferenceExtractor(context)

    const container: any = {
      properties: [],
      propertyReferences: [],
      propertyReferencesForProps: [],
    }

    const templatePropertiesContainer: any = {
      propertyReferences: [],
    }

    function getParentProperty(node: TSESTree.Expression) {
      if (
        !node.parent
        || node.parent.type !== 'Property'
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
        })
      }
    }

    const mappingSelector = getMappingSelector(mappingFunctions)

    const scriptVisitor = utils.compositingVisitors(
      {
        [`${mappingSelector} ObjectExpression Property`](node: TSESTree.PropertyNonComputedName) {
          container.properties.push({
            name: node.key.type === 'Identifier' ? node.key.name : node.key.value,
            node,
          })
        },
        [`${mappingSelector} > ArrayExpression Literal`](node: TSESTree.Literal) {
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
                    handlerValueNode.type === 'Literal'
                    || handlerValueNode.type === 'TemplateLiteral'
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
        // eslint-disable-next-line @typescript-eslint/naming-convention
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
        onSetupFunctionEnter(node) {
          const propertyReferences = propertyReferenceExtractor.extractFromFunctionParam(node, 0)
          container.propertyReferencesForProps.push(propertyReferences)
        },
        onRenderFunctionEnter(node, vueData) {
          // Check for Vue 3.x render
          const propertyReferences = propertyReferenceExtractor.extractFromFunctionParam(node, 0)
          container.propertyReferencesForProps.push(propertyReferences)
          if (vueData.functional) {
            // Check for Vue 2.x render & functional
            const propertyReferencesForV2 = propertyReferenceExtractor.extractFromFunctionParam(node, 1)
            container.propertyReferencesForProps.push(
              propertyReferencesForV2.getNest('props'),
            )
          }
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'ThisExpression, Identifier'(node: TSESTree.ThisExpression | TSESTree.Identifier) {
          if (!utils.isThis(node, context)) return
          const propertyReferences = propertyReferenceExtractor.extractFromExpression(node, false)
          container.propertyReferences.push(propertyReferences)
        },
      }),
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
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
      // eslint-disable-next-line @typescript-eslint/naming-convention
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
      // eslint-disable-next-line @typescript-eslint/naming-convention
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
