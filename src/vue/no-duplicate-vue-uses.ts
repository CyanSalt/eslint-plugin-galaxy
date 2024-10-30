import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, AST_TOKEN_TYPES } from '@typescript-eslint/utils'
import micromatch from 'micromatch'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-duplicate-vue-uses'

function getImportDeclaration(code: TSESLint.SourceCode, node: TSESTree.Node, name: string) {
  const scope = code.getScope(node)
  const variable = scope.variables.find(item => item.name === name)
  if (!variable) return undefined
  const importBinding = variable.defs.find(
    (item): item is TSESLint.Scope.Definitions.ImportBindingDefinition => item.type === 'ImportBinding',
  )
  return importBinding ? importBinding.parent : undefined
}

function getUseDeclarator(node: TSESTree.CallExpression) {
  let call = node
  let wrapper: string | undefined
  // Support `$`, `toRefs` or `storeToRefs` (except nested)
  if (node.parent.type === AST_NODE_TYPES.CallExpression) {
    call = node.parent
    if (node.parent.callee.type === AST_NODE_TYPES.Identifier) {
      wrapper = node.parent.callee.name
    }
  }
  if (call.parent.type === AST_NODE_TYPES.VariableDeclarator) {
    return {
      wrapper,
      defined: call.parent.id,
      initializer: call,
      parent: call.parent.parent,
    }
  }
  return undefined
}

function isMultilineNode(node: TSESTree.Node) {
  return node.loc.end.line > node.loc.start.line
}

const DECLARATION_KIND: TSESTree.VariableDeclaration['kind'][] = ['await using', 'using', 'var', 'let', 'const']

function isIncompatibleDeclarationKind(existing: TSESTree.VariableDeclaration, current: TSESTree.VariableDeclaration) {
  return DECLARATION_KIND.indexOf(existing.kind) > DECLARATION_KIND.indexOf(current.kind)
}

function getPropertyRange(code: TSESLint.SourceCode, node: TSESTree.ObjectPattern) {
  const openCurly = code.getFirstToken(node)!
  const closeCurly = code.getLastToken(node)!
  let firstToken = code.getTokenAfter(openCurly)!
  let lastToken = code.getTokenBefore(closeCurly)!
  if (lastToken.type === AST_TOKEN_TYPES.Punctuator) {
    lastToken = code.getTokenBefore(lastToken)!
  }
  return [firstToken.range[0], lastToken.range[1]] as const
}

function getAllPropertyText(code: TSESLint.SourceCode, node: TSESTree.ObjectPattern) {
  const range = getPropertyRange(code, node)
  return code.getText(node).slice(
    range[0] - node.range[0],
    range[1] - node.range[1],
  )
}

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow duplicate composition calls from specified paths',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          paths: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          ignoreDifferentUsages: {
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      [MESSAGE_ID_DEFAULT]: '"{{name}}" has been called on line {{line}}.',
    },
  },
  defaultOptions: [
    {
      paths: [],
      ignoreDifferentUsages: false,
    } as {
      paths?: string[],
      ignoreDifferentUsages?: boolean,
    } | undefined,
  ],
  create(context) {
    const code = context.sourceCode
    const paths = context.options[0]?.paths ?? []
    const ignoreDifferentUsages = context.options[0]?.ignoreDifferentUsages
    const matchers = paths.map(path => micromatch.matcher(path))
    const isMatch = (source: string) => matchers.some(matcher => matcher(source))
    const uses = new Map<string, {
      node: TSESTree.CallExpression,
      source: string,
    }>()

    return {
      'CallExpression[callee.name=/^use.+/]'(node: TSESTree.CallExpression & { callee: TSESTree.Identifier }) {
        const name = node.callee.name
        const decl = getImportDeclaration(code, node, node.callee.name)
        if (!decl) return
        let source: string | undefined
        if (decl.type === AST_NODE_TYPES.ImportDeclaration) {
          source = decl.source.value
        } else if (decl.moduleReference.type === AST_NODE_TYPES.TSExternalModuleReference) {
          source = decl.moduleReference.expression.value
        }
        if (!source || !isMatch(source)) return
        if (uses.has(name)) {
          const existing = uses.get(name)!
          const existingDeclarator = getUseDeclarator(existing.node)
          const currentDeclarator = getUseDeclarator(node)
          if (!currentDeclarator) {
            context.report({
              node,
              messageId: MESSAGE_ID_DEFAULT,
              data: {
                name,
                line: existing.node.loc.start.line,
              },
            })
          } else if (!existingDeclarator) {
            uses.set(name, {
              node,
              source,
            })
          } else if (existingDeclarator.wrapper === currentDeclarator.wrapper) {
            context.report({
              node,
              messageId: MESSAGE_ID_DEFAULT,
              data: {
                name,
                line: existing.node.loc.start.line,
              },
              *fix(fixer) {
                const existingDefined = existingDeclarator.defined
                const currentDefined = currentDeclarator.defined
                if (existingDeclarator.defined.type === AST_NODE_TYPES.Identifier) {
                  // Replace with identifier
                  yield fixer.replaceText(currentDeclarator.initializer, existingDeclarator.defined.name)
                } else if (
                  currentDefined.type === AST_NODE_TYPES.ObjectPattern
                  && existingDefined.type === AST_NODE_TYPES.ObjectPattern
                ) {
                  // Merge object patterns
                  const properties = currentDefined.properties
                  const existingProperties = existingDefined.properties
                  const beforeToken = code.getTokenBefore(currentDeclarator.parent)
                  yield fixer.removeRange([
                    beforeToken ? beforeToken.range[1] : currentDeclarator.parent.range[0],
                    currentDeclarator.parent.range[1],
                  ])
                  if (existingProperties.length) {
                    const isExistingMultiline = isMultilineNode(existingDefined)
                    const isCurrentMultiline = isMultilineNode(currentDefined)
                    const isMultiline = isExistingMultiline || isCurrentMultiline
                    const existingText = isMultiline && !isExistingMultiline
                      ? existingProperties.map(property => code.getText(property)).join(',\n')
                      : getAllPropertyText(code, existingDefined)
                    const currentText = isMultiline && !isCurrentMultiline
                      ? properties.map(property => code.getText(property)).join(',\n')
                      : getAllPropertyText(code, currentDefined)
                    const sep = isMultiline ? ',\n' : ', '
                    const edge = isMultiline && !isExistingMultiline ? '\n' : ''
                    yield fixer.replaceTextRange(
                      getPropertyRange(code, existingDefined),
                      `${edge}${existingText}${sep}${currentText}${edge}`,
                    )
                  }
                  if (isIncompatibleDeclarationKind(existingDeclarator.parent, currentDeclarator.parent)) {
                    yield fixer.replaceText(
                      code.getFirstToken(existingDeclarator.parent)!,
                      currentDeclarator.parent.kind,
                    )
                  }
                }
              },
            })
          } else if (!ignoreDifferentUsages) {
            context.report({
              node,
              messageId: MESSAGE_ID_DEFAULT,
              data: {
                name,
                line: existing.node.loc.start.line,
              },
            })
          }
        } else {
          uses.set(name, {
            node,
            source,
          })
        }
      },
    }
  },
})
