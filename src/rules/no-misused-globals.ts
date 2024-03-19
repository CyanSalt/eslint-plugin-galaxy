import type { TSESLint } from '@typescript-eslint/utils'
import * as globals from 'globals'
import { createRule } from '../utils'

const MESSAGE_ID_PROTOTYPE_BUILTINS = 'no-misused-globals.prototype-builtins'
const MESSAGE_ID_DEPRECATED = 'no-misused-globals.deprecated'
const MESSAGE_ID_EVENTS = 'no-misused-globals.events'
const MESSAGE_ID_AMBIGUOUS_SINGLE_WORDS = 'no-misused-globals.ambiguous-single-words'

const DEPRECATED_GLOBALS = [
  'applicationCache',
  'defaultstatus',
  'defaultStatus',
  'event',
  'external',
  'orientation',
  'status',
  'releaseEvents',
]

const EVENT_GLOBALS = [
  'addEventListener',
  'dispatchEvent',
  'removeEventListener',
]

const AMBIGUOUS_SINGLE_WORD_GLOBALS = [
  'blur',
  'close',
  'closed',
  'find',
  'focus',
  'length',
  'name',
  'open',
  'opener',
  'origin',
  'parent',
  'print',
  'scroll',
  'stop',
  'top',
]

interface MisusedGlobalDeclaration {
  name: string,
  messageId: typeof MESSAGE_ID_PROTOTYPE_BUILTINS
  | typeof MESSAGE_ID_DEPRECATED
  | typeof MESSAGE_ID_EVENTS
  | typeof MESSAGE_ID_AMBIGUOUS_SINGLE_WORDS,
}

const DEFAULT_OPTIONS = {
  prototypeBuiltins: true,
  deprecated: true,
  events: true,
  ambiguousSingleWords: true,
}

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow global variables that may be misused',
    },
    schema: [
      {
        type: 'object',
        properties: {
          prototypeBuiltins: {
            type: 'boolean',
          },
          deprecated: {
            type: 'boolean',
          },
          events: {
            type: 'boolean',
          },
          ambiguousSingleWords: {
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      [MESSAGE_ID_PROTOTYPE_BUILTINS]: '"{{ name }}" references the global object implicitly',
      [MESSAGE_ID_DEPRECATED]: '"{{ name }}" is no longer recommended',
      [MESSAGE_ID_EVENTS]: '"{{ name }}" should be used through the Window instance',
      [MESSAGE_ID_AMBIGUOUS_SINGLE_WORDS]: '"{{ name }}" is a global variable that may be ambiguous',
    },
  },
  defaultOptions: [DEFAULT_OPTIONS as Partial<typeof DEFAULT_OPTIONS>],
  create(context) {
    return {
      Program(root) {
        const scope = context.sourceCode.getScope?.(root)
        if (!scope) return
        const options = { ...DEFAULT_OPTIONS, ...context.options[0] }

        let misusedGlobals: MisusedGlobalDeclaration[] = []
        if (options.prototypeBuiltins) {
          misusedGlobals = misusedGlobals.concat(
            Object.getOwnPropertyNames(Object.prototype).map(name => ({
              name,
              messageId: MESSAGE_ID_PROTOTYPE_BUILTINS,
            })),
          )
        }
        if (options.deprecated) {
          misusedGlobals = misusedGlobals.concat(
            DEPRECATED_GLOBALS.map(name => ({
              name,
              messageId: MESSAGE_ID_DEPRECATED,
            })),
          )
        }
        if (options.events) {
          misusedGlobals = misusedGlobals.concat(
            Object.keys(globals.browser)
              .filter(name => {
                return EVENT_GLOBALS.includes(name) || name.slice(0, 2) === 'on'
              })
              .map(name => ({
                name,
                messageId: MESSAGE_ID_EVENTS,
              })),
          )
        }
        if (options.ambiguousSingleWords) {
          misusedGlobals = misusedGlobals.concat(
            AMBIGUOUS_SINGLE_WORD_GLOBALS.map(name => ({
              name,
              messageId: MESSAGE_ID_AMBIGUOUS_SINGLE_WORDS,
            })),
          )
        }

        function getMisusedDeclaration(name: string) {
          return misusedGlobals.find(decl => decl.name === name)
        }

        function checkReference(reference: TSESLint.Scope.Reference) {
          const name = reference.identifier.name
          const decl = getMisusedDeclaration(name)
          if (decl) {
            context.report({
              node: reference.identifier,
              messageId: decl.messageId,
              data: {
                name,
              },
            })
          }
        }

        // Report variables declared elsewhere (ex: variables defined as "global" by eslint)
        scope.variables.forEach(variable => {
          if (!variable.defs.length) {
            variable.references.forEach(checkReference)
          }
        })

        // Report variables not declared at all
        scope.through.forEach(reference => {
          checkReference(reference)
        })

      },
    }
  },
})
