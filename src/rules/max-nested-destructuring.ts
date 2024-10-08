import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../utils'

const MESSAGE_ID_DEFAULT = 'max-nested-destructuring'

export default createRule({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce a maximum depth that destructuring can be nested',
    },
    schema: [
      {
        type: 'object',
        properties: {
          max: {
            type: 'number',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      [MESSAGE_ID_DEFAULT]: 'Too many nested destructuring ({{num}}). Maximum allowed is {{max}}.',
    },
  },
  defaultOptions: [
    { max: 3 } as { max?: number } | undefined,
  ],
  create(context) {
    const max = context.options[0]?.max ?? 3
    const destructuringStack: TSESTree.Node[] = []
    function checkFunction(node: TSESTree.Node) {
      destructuringStack.push(node)
      if (destructuringStack.length > max) {
        context.report({
          node,
          messageId: MESSAGE_ID_DEFAULT,
          data: {
            num: destructuringStack.length,
            max,
          },
        })
      }
    }
    function popStack() {
      destructuringStack.pop()
    }
    return {
      ArrayPattern: checkFunction,
      'ArrayPattern:exit': popStack,
      ObjectPattern: checkFunction,
      'ObjectPattern:exit': popStack,
    }
  },
})
