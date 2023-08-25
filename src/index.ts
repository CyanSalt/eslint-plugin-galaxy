import * as fs from 'fs'
import * as path from 'path'
import type { TSESLint } from '@typescript-eslint/utils'

type RuleModule = TSESLint.RuleModule<string, unknown[]> & {
  meta: Required<Pick<TSESLint.RuleMetaData<string>, 'docs'>>,
}

function importDefault(obj: any) {
  return obj?.__esModule ? obj.default : obj
}

function loadRules(dir: string) {
  return fs.readdirSync(dir)
    .map(rule => path.parse(rule).name)
    .reduce<Record<string, RuleModule>>((map, name) => Object.assign(map, {
      [name]: importDefault(require(path.join(dir, name))),
    }), {})
}

function getRecommendedRules(record: Record<string, RuleModule>) {
  return Object.entries(record)
    .filter(([, rule]) => rule.meta.docs.recommended)
    .reduce((config, [name, rule]) => Object.assign(config, {
      [`galaxy/${name}`]: 'error',
    }), {})
}

function getAllRules(record: Record<string, RuleModule>) {
  return Object.entries(record)
    .filter(([, rule]) => !rule.meta.deprecated)
    .reduce((config, [name]) => Object.assign(config, {
      [`galaxy/${name}`]: 'error',
    }), {})
}

const baseRules = loadRules(path.join(__dirname, 'rules'))
const tsRules = loadRules(path.join(__dirname, 'typescript'))
const vueRules = loadRules(path.join(__dirname, 'vue'))

const processors = {}
try {
  processors['.vue'] = require('eslint-plugin-vue/lib/processor')
} catch {
  // ignore error
}

const { name, version } = require('../package.json')

module.exports = {
  meta: {
    name,
    version,
  },
  rules: {
    ...baseRules,
    ...tsRules,
    ...vueRules,
  },
  configs: {
    recommended: {
      plugins: [
        'galaxy',
      ],
      rules: getRecommendedRules(baseRules),
    },
    'recommended-vue': {
      plugins: [
        'galaxy',
      ],
      rules: getRecommendedRules(vueRules),
    },
    all: {
      plugins: [
        'galaxy',
      ],
      rules: {
        ...getAllRules(baseRules),
        ...getAllRules(tsRules),
        ...getAllRules(vueRules),
      },
    },
  },
  processors,
}
