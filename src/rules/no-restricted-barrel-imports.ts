import * as path from 'path'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-restricted-barrel-imports'

interface ExportMap {
  path: string,
  imports: Map<string, {
    getter: () => ExportMap,
    declarations: Set<{
      source: TSESTree.StringLiteral,
    }>,
  }>,
  dependencies: Set<() => ExportMap | undefined>,
  hasDeep(name: string): {
    found: boolean,
    path: ExportMap[],
  },
}

function isRelativeImport(importSource: string) {
  return importSource === '.'
    || importSource === '..'
    || importSource.startsWith('./')
    || importSource.startsWith('../')
}

function joinImportSource(sourcePath: string, relativePath: string, isDirectory: boolean) {
  const sourceDirectory = isDirectory ? sourcePath : path.posix.dirname(sourcePath)
  const target = path.posix.join(sourceDirectory, relativePath)
  return isRelativeImport(sourceDirectory) && !isRelativeImport(target)
    ? './' + target
    : target
}

function resolveImportSource(
  exportMap: ExportMap,
  importSource: string,
  source: string,
  context: TSESLint.RuleContext<string, unknown[]>,
) {
  const { default: resolve } = require('eslint-module-utils/resolve')
  if (isRelativeImport(source)) {
    const importSourceExt = path.extname(importSource)
    if (!importSourceExt) {
      const importSourceWithExt = importSource + path.extname(exportMap.path)
      if (resolve(importSourceWithExt, context) !== exportMap.path) {
        return joinImportSource(importSource, source, true)
      }
    }
    return joinImportSource(importSource, source, false)
  }
  return source
}

function resolveImportSources<T>(
  exportMap: ExportMap,
  importSource: string,
  values: Map<string, T>,
  context: TSESLint.RuleContext<string, unknown[]>,
) {
  const result = new Map<string, T>()
  for (const [importPath, value] of values) {
    const { declarations } = exportMap.imports.get(importPath)!
    for (const decl of declarations) {
      const deepSource = resolveImportSource(exportMap, importSource, decl.source.value, context)
      result.set(deepSource, value)
    }
  }
  return result
}

function resolveDeepImports(
  exportMap: ExportMap,
  importSource: string,
  imports: Set<string>,
  context: TSESLint.RuleContext<string, unknown[]>,
) {
  const result = new Map<string, Set<string>>()
  const processingImports = new Set(imports)
  for (const getter of exportMap.dependencies) {
    const dependency = getter()
    if (!dependency) continue
    for (const name of processingImports) {
      if (dependency.hasDeep(name).found) {
        let names = result.get(dependency.path)
        if (!names) {
          names = new Set<string>()
          result.set(dependency.path, names)
        }
        names.add(name)
        processingImports.delete(name)
      }
    }
  }
  if (!result.size) return null
  const deepImports = resolveImportSources(exportMap, importSource, result, context)
  if (processingImports.size) {
    deepImports.set(importSource, processingImports)
  }
  return deepImports
}

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow specified barrel modules when loaded by `import`',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      [MESSAGE_ID_DEFAULT]: '"{{ importSource }}" import is restricted from being used.',
    },
  },
  defaultOptions: [
    { files: [] as string[] },
  ],
  create(context) {
    let hasImportX = false
    try {
      require.resolve('eslint-plugin-import-x')
      hasImportX = true
    } catch {
      // ignore error
    }
    const { moduleVisitor } = hasImportX
      ? require('eslint-plugin-import-x/utils/module-visitor.js')
      : { moduleVisitor: require('eslint-module-utils/moduleVisitor').default }
    const { ExportMap } = hasImportX
      ? require('eslint-plugin-import-x/utils/export-map.js')
      : require('eslint-plugin-import/lib/ExportMap')

    const { files = [] } = context.options[0] ?? {}

    function checkBarrelImports(
      source: TSESTree.StringLiteral | null,
      node: TSESTree.ImportDeclaration | TSESTree.ImportExpression,
    ) {
      if (!source?.value) return
      const imported = ExportMap.get(source.value, context) as ExportMap | undefined
      if (!imported) return
      const specifiers = node.type === AST_NODE_TYPES.ImportDeclaration ? node.specifiers : []
      const mapping = specifiers
        .filter((specifier): specifier is TSESTree.ImportSpecifier => specifier.type === AST_NODE_TYPES.ImportSpecifier)
        .reduce((imports, specifier) => {
          imports.set(specifier.imported.name, specifier.local.name)
          return imports
        }, new Map<string, string>())
      if (files.includes(imported.path)) {
        context.report({
          node,
          messageId: MESSAGE_ID_DEFAULT,
          data: {
            importSource: source.value,
          },
          fix(fixer) {
            const deepImports = resolveDeepImports(imported, source.value, new Set(mapping.keys()), context)
            if (!deepImports) return null
            return fixer.replaceText(node, Array.from(deepImports).map(([deepSource, names]) => {
              return `import { ${Array.from(names).map(name => {
                const localName = mapping.get(name)
                return localName === name ? name : `${name} as ${localName}`
              }).join(', ')} } from '${deepSource}'`
            }).join(';\n'))
          },
        })
      }
    }

    return moduleVisitor(checkBarrelImports, { commonjs: true })
  },
})
