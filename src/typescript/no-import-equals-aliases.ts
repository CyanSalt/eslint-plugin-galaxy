import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { getImportedName } from '../estree'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-import-equals-aliases'

export default createRule({
  name: import.meta.filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow import-equals declarations with a bare identifier',
    },
    fixable: 'code',
    schema: [],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Unexpected use of import-equals declarations with a bare identifier',
    },
  },
  create(context) {
    return {
      'TSImportEqualsDeclaration[moduleReference.type="Identifier"]': (
        node: TSESTree.TSImportEqualsDeclaration & { moduleReference: TSESTree.Identifier },
      ) => {
        const code = context.sourceCode
        context.report({
          node,
          messageId: MESSAGE_ID_DEFAULT,
          *fix(fixer) {
            const scope = code.getScope(node)
            // Ensure intermediate identifier is unused
            const references = scope.references.find(ref => ref.identifier === node.moduleReference)
            const variable = references?.resolved
            if (!variable || variable.references.length > 1) return

            const exportDecl = node.parent.type === AST_NODE_TYPES.ExportNamedDeclaration
              ? node.parent : undefined
            // Ignore export inside namespaces
            if (exportDecl && exportDecl.parent.type !== AST_NODE_TYPES.Program) return

            // Ensure identifier has no conflict
            const existing = variable.scope.set.get(node.id.name)
            if (existing?.defs.some(def => def.node !== node)) return

            const binding = variable.defs.find(def => def.type === 'ImportBinding')
            if (!binding) return
            const specifier = binding.node
            if (specifier.type === AST_NODE_TYPES.TSImportEqualsDeclaration) {
              yield fixer.replaceText(specifier.id, node.id.name)
            } else if (
              specifier.type === AST_NODE_TYPES.ImportSpecifier
              && getImportedName(specifier) === specifier.local.name
            ) {
              yield fixer.insertTextAfter(specifier.local, ` as ${node.id.name}`)
            } else {
              yield fixer.replaceText(specifier.local, node.id.name)
            }

            if (exportDecl) {
              const lastToken = code.getLastToken(node)
              yield fixer.replaceText(node, `{ ${node.id.name} }${lastToken?.value === ';' ? ';' : ''}`)
            } else {
              const beforeToken = code.getTokenBefore(node)
              yield fixer.removeRange([
                beforeToken ? beforeToken.range[1] : node.range[0],
                node.range[1],
              ])
            }
          },
        })
      },
    }
  },
})
