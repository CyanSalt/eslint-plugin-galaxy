import * as path from 'path'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { ModuleInfo } from 'eslint-plugin-import-x/core/index'
import { getImportedName } from '../estree'
import { createRule, loadESLintPluginImportCore, loadESLintPluginImportUtils } from '../utils'

const MESSAGE_ID_DEFAULT = 'no-restricted-barrel-imports'

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
  moduleInfo: ModuleInfo,
  importSource: string,
  source: string,
  context: TSESLint.RuleContext<string, readonly unknown[]>,
) {
  const { resolve } = loadESLintPluginImportUtils()
  if (isRelativeImport(source)) {
    const importSourceExt = path.extname(importSource)
    if (!importSourceExt) {
      const importSourceWithExt = importSource + path.extname(moduleInfo.path)
      if (resolve(importSourceWithExt, context) !== moduleInfo.path) {
        return joinImportSource(importSource, source, true)
      }
    }
    return joinImportSource(importSource, source, false)
  }
  return source
}

function resolveImportSources<T>(
  moduleInfo: ModuleInfo,
  importSource: string,
  values: Map<string, T>,
  context: TSESLint.RuleContext<string, readonly unknown[]>,
) {
  const result = new Map<string, T>()
  for (const [importPath, value] of values) {
    const imports = moduleInfo.getImports()
    const { declarations } = imports.get(importPath)!
    for (const decl of declarations) {
      const deepSource = resolveImportSource(moduleInfo, importSource, decl.source.value as string, context)
      result.set(deepSource, value)
    }
  }
  return result
}

function resolveDeepImports(
  moduleInfo: ModuleInfo,
  importSource: string,
  imports: Set<string>,
  context: TSESLint.RuleContext<string, readonly unknown[]>,
) {
  const result = new Map<string, Set<string>>()
  const processingImports = new Set(imports)
  const { getStarExportPaths, resolveDeepExport } = loadESLintPluginImportCore()
  const dependencies = moduleInfo.getImports()
  for (const dependencyPath of getStarExportPaths(moduleInfo)) {
    const depImport = dependencies.get(dependencyPath)
    const dependency = depImport?.resolve()
    if (!dependency) continue
    for (const name of processingImports) {
      const resolved = resolveDeepExport(dependency, name)
      if (resolved.found) {
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
  const deepImports = resolveImportSources(moduleInfo, importSource, result, context)
  if (processingImports.size) {
    deepImports.set(importSource, processingImports)
  }
  return deepImports
}

export default createRule({
  name: import.meta.filename,
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
    defaultOptions: [
      { files: [] },
    ] as [
      { files?: string[] } | undefined,
    ],
  },
  create(context) {
    const { ModuleInfo } = loadESLintPluginImportCore()
    const { moduleVisitor } = loadESLintPluginImportUtils()

    const { files = [] } = context.options[0] ?? {}

    function checkBarrelImports(
      source: TSESTree.StringLiteral | null,
      node: TSESTree.ImportDeclaration | TSESTree.ImportExpression,
    ) {
      if (!source?.value) return
      const imported = ModuleInfo.get(source.value, context)
      if (!imported) return
      const specifiers = node.type === AST_NODE_TYPES.ImportDeclaration ? node.specifiers : []
      const mapping = specifiers
        .filter((specifier): specifier is TSESTree.ImportSpecifier => specifier.type === AST_NODE_TYPES.ImportSpecifier)
        .reduce((imports, specifier) => {
          imports.set(getImportedName(specifier), specifier.local.name)
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
