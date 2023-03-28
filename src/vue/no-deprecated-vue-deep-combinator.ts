import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../utils'

// @ts-expect-error extend ast spec node
interface CSSNode extends TSESTree.BaseNode {
  type: string,
  nodes: CSSNode[],
  parent: CSSNode,
}

interface CSSStyleRule extends CSSNode {
  selectors: CSSSelector[],
  selectorText: string,
}

interface CSSSelector extends CSSNode {
  value: string,
  nodes: CSSSelector[],
}

function getSelectorNodeValueRange(node: CSSSelector) {
  return [
    node.range[0],
    node.range[0] + node.value.length,
  ] as const
}

function getSelectorReferences(node: CSSNode, includingAtRules?: boolean): CSSStyleRule[] {
  return node.nodes.flatMap(item => {
    if (item.type === 'VCSSStyleRule') {
      return (item as CSSStyleRule).selectors.some(selector => {
        const nestingIndex = selector.nodes.findIndex(selectorNode => selectorNode.type === 'VCSSNestingSelector')
        if (nestingIndex === -1 || nestingIndex === selector.nodes.length - 1) return false
        const nestingNode = selector.nodes[nestingIndex]
        const nextSibling = selector.nodes[nestingIndex + 1]
        return nextSibling.type === 'VCSSTypeSelector'
          && nextSibling.range[0] === nestingNode.range[1]
      }) ? [item as CSSStyleRule] : []
    }
    if (includingAtRules && item.type === 'VCSSAtRule') {
      return getSelectorReferences(item, includingAtRules)
    }
    return []
  })
}

function isContainerNode(node: CSSNode) {
  return node.type === 'VCSSStyleSheet'
    || node.type === 'VCSSStyleRule'
    || node.type === 'VCSSAtRule'
    || node.type === 'VCSSUnknown'
}

function isAllOverlapped(node: CSSNode, nodes: CSSNode[]) {
  if (nodes.includes(node)) return true
  if (isContainerNode(node)) {
    return node.nodes.every(item => isAllOverlapped(item, nodes))
  } else {
    return false
  }
}

function findOverlappedNodes(node: CSSNode, nodes: CSSNode[]) {
  if (isAllOverlapped(node, nodes)) return [node]
  if (isContainerNode(node)) {
    return node.nodes.flatMap(item => findOverlappedNodes(item, nodes))
  } else {
    return []
  }
}

function removeCSSNode(fixer: TSESLint.RuleFixer, node: CSSNode) {
  const siblings = node.parent.nodes
  const index = siblings.indexOf(node)
  if (index > 0) {
    return fixer.removeRange([siblings[index - 1].range[1], node.range[1]])
  }
  if (index < siblings.length - 1) {
    return fixer.removeRange([node.range[0], siblings[index + 1].range[0]])
  }
  return fixer.remove(node as TSESTree.Node)
}

function resolveNestingSelector(selector: string, parentSelector: string) {
  return parentSelector.replace(/(.+?)(\s*,\s*|$)/g, (full, ref, combinator) => {
    return selector.replace(/&/g, ref) + combinator
  })
}

function resolveNestingRule(code: TSESLint.SourceCode, rule: CSSStyleRule, reference: CSSStyleRule) {
  const text = code.getText(rule as TSESTree.Node)
  let selectorText = text.slice(0, rule.selectorText.length)
  let declarationText = text.slice(rule.selectorText.length)
  return resolveNestingSelector(selectorText, reference.selectorText) + declarationText
}

const MESSAGE_ID_DEFAULT = 'no-deprecated-vue-deep-combinator'

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow using deprecated Vue `::v-deep` combinators',
      recommended: false,
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'The deep combinator `::v-deep` is deprecated.',
    },
  },
  defaultOptions: [],
  create(context) {
    const {
      getStyleContexts,
      getCommentDirectivesReporter,
      isValidStyleContext,
    } = require('eslint-plugin-vue-scoped-css/dist/styles/context')

    const code = context.getSourceCode()
    const reporter: Pick<typeof context, 'report'> = getCommentDirectivesReporter(context)

    return {
      'Program:exit'() {
        const styles = getStyleContexts(context)
          .filter(isValidStyleContext)
          .filter(style => style.scoped)
        for (const style of styles) {
          style.traverseSelectorNodes({
            enterNode(node: CSSSelector) {
              if (node.type === 'VCSSSelectorPseudo' && node.value.trim() === '::v-deep') {
                reporter.report({
                  node: node as TSESTree.Node,
                  loc: node.loc,
                  messageId: MESSAGE_ID_DEFAULT,
                  *fix(fixer) {
                    if (node.nodes.length) {
                      // Replace `::v-deep` to `:deep`
                      yield fixer.replaceTextRange(
                        getSelectorNodeValueRange(node),
                        ':deep',
                      )
                    } else {
                      // Restructure nested rules
                      const ruleNode = node.parent.parent as CSSStyleRule
                      if (ruleNode.type === 'VCSSStyleRule') {
                        const refRules = getSelectorReferences(ruleNode)
                        if (refRules.length) {
                          const refRulesText = refRules.map(rule => {
                            return resolveNestingRule(code, rule, ruleNode)
                          }).join('\n')
                          const removedNodes = findOverlappedNodes(ruleNode, refRules)
                          for (const rule of removedNodes) {
                            // Avoid overlapping
                            if (rule === ruleNode) {
                              yield fixer.remove(rule as TSESTree.Node)
                            } else {
                              yield removeCSSNode(fixer, rule)
                            }
                          }
                          const sep = removedNodes.includes(ruleNode) ? '' : '\n'
                          yield fixer.insertTextAfter(ruleNode as TSESTree.Node, sep + refRulesText)
                          return
                        }
                        // May not be fixed
                        const refAtRules = getSelectorReferences(ruleNode, true)
                        if (refAtRules.length) return
                      }

                      const nodes = (node.parent as CSSSelector).nodes
                      const selectorIndex = nodes.indexOf(node)
                      // Use `galaxy/selector-nested-combinator-position` of stylelint
                      if (selectorIndex === -1 || selectorIndex === nodes.length - 1) return null

                      const nextSiblings = nodes.slice(selectorIndex + 1)
                      const isReferenced = nextSiblings.some(selectorNode => selectorNode.type === 'VCSSNestingSelector')
                      if (isReferenced) {
                        const parentRuleNode = ruleNode.parent as CSSStyleRule
                        // Restructure nested rules
                        if (ruleNode.type === 'VCSSStyleRule' && parentRuleNode.type === 'VCSSStyleRule') {
                          const ruleText = resolveNestingRule(code, ruleNode, parentRuleNode)
                          if (isAllOverlapped(parentRuleNode, [ruleNode])) {
                            yield fixer.remove(parentRuleNode as TSESTree.Node)
                          } else {
                            yield removeCSSNode(fixer, ruleNode)
                          }
                          yield fixer.insertTextAfter(parentRuleNode as TSESTree.Node, ruleText)
                        }
                        // May not be fixed
                        return
                      }

                      // Replace `::v-deep .foo .bar` to `:deep(.foo .bar)`
                      yield fixer.replaceTextRange(
                        getSelectorNodeValueRange(node),
                        ':deep',
                      )
                      const nextNode = nodes[selectorIndex + 1]
                      const combinatorEnd = node.range[0] + node.value.length
                      const nextNodeStart = nextNode.range[0]
                      yield fixer.replaceTextRange([combinatorEnd, nextNodeStart], '(')

                      const lastNode = nodes[nodes.length - 1]
                      yield fixer.insertTextAfter(lastNode as TSESTree.Node, ')')
                    }
                  },
                })
              }
            },
          })
        }
      },
    }
  },
})
