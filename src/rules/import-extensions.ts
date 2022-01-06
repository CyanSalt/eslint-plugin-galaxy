import * as path from 'path'
import type { TSESTree } from '@typescript-eslint/experimental-utils'
import { createRule } from '../utils'

const MESSAGE_ID_REQUIRED = 'import-extensions.required'
const MESSAGE_ID_FORBIDDEN = 'import-extensions.forbidden'

const ENUM_VALUES = ['always', 'ignore', 'ignorePackages', 'never'] as const

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensure consistent use of file extension within the import path',
      recommended: false,
    },
    fixable: 'code',
    schema: [
      {
        anyOf: [
          {
            enum: ENUM_VALUES,
          },
          {
            type: 'object',
            patternProperties: {
              '.*': {
                enum: ENUM_VALUES,
              },
            },
          },
        ],
      },
    ],
    messages: {
      [MESSAGE_ID_REQUIRED]: 'Missing file extension "{{ extension }}" for "{{ path }}"',
      [MESSAGE_ID_FORBIDDEN]: 'Unexpected use of file extension "{{ extension }}" for "{{ path }}"',
    },
  },
  defaultOptions: [
    'ignore' as typeof ENUM_VALUES[number] | Record<string, typeof ENUM_VALUES[number] | undefined>,
  ],
  create(context) {
    const { default: resolve } = require('eslint-module-utils/resolve')
    const { default: moduleVisitor } = require('eslint-module-utils/moduleVisitor')
    const { isBuiltIn, isExternalModule, isScoped } = require('eslint-plugin-import/lib/core/importType')

    const options = typeof context.options[0] === 'object'
      ? context.options[0]
      : { '*': context.options[0] }

    function getModifier(extension: string) {
      return options[extension] ?? options['*'] ?? 'ignore'
    }

    function isUseOfExtensionRequired(extension: string, isPackage: boolean) {
      return getModifier(extension) === 'always'
        || getModifier(extension) === 'ignorePackages' && !isPackage
    }

    function isUseOfExtensionForbidden(extension: string) {
      return getModifier(extension) === 'never'
    }

    function isResolvableWithoutExtension(file: string) {
      const extension = path.extname(file)
      const fileWithoutExtension = file.slice(0, -extension.length)
      const resolvedFileWithoutExtension = resolve(fileWithoutExtension, context)

      return resolvedFileWithoutExtension === resolve(file, context)
    }

    function isExternalRootModule(file: string) {
      const slashCount = file.split('/').length - 1

      if (slashCount === 0) return true
      if (isScoped(file) && slashCount <= 1) return true
      return false
    }

    function checkFileExtension(
      source: TSESTree.StringLiteral | null,
      node: TSESTree.ImportDeclaration,
    ) {
      // bail if the declaration doesn't have a source, e.g. "export { foo };", or if it's only partially typed like in an editor
      if (!source || !source.value) return

      const importPathWithQueryString = source.value

      // don't enforce anything on builtins
      if (isBuiltIn(importPathWithQueryString, context.settings)) return

      const importPath = importPathWithQueryString.replace(/\?(.*)$/, '')

      // don't enforce in root external packages as they may have names with `.js`.
      // Like `import Decimal from 'decimal.js'`)
      if (isExternalRootModule(importPath)) return

      const resolvedPath = resolve(importPath, context)

      // get extension from resolved path, if possible.
      // for unresolved, use source value.
      const extension = path.extname(resolvedPath || importPath)

      // determine if this is a module
      const isPackage = isExternalModule(
        importPath,
        resolve(importPath, context),
        context,
      ) || isScoped(importPath)

      if (!importPath.endsWith(extension)) {
        // ignore type-only imports
        if (node.importKind === 'type') return
        const extensionRequired = isUseOfExtensionRequired(extension, isPackage)
        const extensionForbidden = isUseOfExtensionForbidden(extension)
        if (extensionRequired && !extensionForbidden) {
          context.report({
            node: source,
            messageId: MESSAGE_ID_REQUIRED,
            data: {
              extension,
              path: importPathWithQueryString,
            },
            fix(fixer) {
              let fixedPath = importPath + extension
              if (resolve(fixedPath, context) !== resolvedPath) {
                fixedPath = path.join(importPath, 'index' + extension)
              }
              const query = importPathWithQueryString.slice(importPath.length)
              return fixer.replaceText(source, `'${fixedPath}${query}'`)
            },
          })
        }
      } else if (extension) {
        if (isUseOfExtensionForbidden(extension) && isResolvableWithoutExtension(importPath)) {
          context.report({
            node: source,
            messageId: MESSAGE_ID_FORBIDDEN,
            data: {
              extension,
              path: importPathWithQueryString,
            },
            fix(fixer) {
              let fixedPath = importPath.slice(0, -extension.length)
              if (path.basename(fixedPath) === 'index') {
                fixedPath = path.dirname(fixedPath)
              }
              const query = importPathWithQueryString.slice(importPath.length)
              return fixer.replaceText(source, `'${fixedPath}${query}'`)
            },
          })
        }
      }
    }

    return moduleVisitor(checkFileExtension, { commonjs: true })
  },
})
