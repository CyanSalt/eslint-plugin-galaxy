import * as fs from 'fs'
import * as path from 'path'
import type { Rule } from './utils'

function importDefault(obj: any) {
  return obj?.__esModule ? obj.default : obj
}

function loadRules(dir: string) {
  return fs.readdirSync(dir)
    .map(rule => path.parse(rule).name)
    .reduce<Record<string, Rule>>((map, name) => Object.assign(map, {
      [name]: importDefault(require(path.join(dir, name))),
    }), {})
}

function getRecommendedRules(record: Record<string, Rule>) {
  return Object.entries(record)
    .filter(([, rule]) => rule.meta.docs.recommended)
    .reduce((config, [name, rule]) => Object.assign(config, {
      [`galaxy/${name}`]: 'error',
    }), {})
}

function getAllRules(record: Record<string, Rule>) {
  return Object.entries(record)
    .filter(([, rule]) => !rule.meta.deprecated)
    .reduce((config, [name]) => Object.assign(config, {
      [`galaxy/${name}`]: 'error',
    }), {})
}

const baseRules = loadRules(path.join(__dirname, 'rules'))
const tsRules = loadRules(path.join(__dirname, 'typescript'))
const vueRules = loadRules(path.join(__dirname, 'vue'))

const { name, version } = require('../package.json')

const plugin = {
  meta: {
    name,
    version,
  },
  rules: {
    ...baseRules,
    ...tsRules,
    ...vueRules,
  },
  configs: {} as Record<string, any>,
}

plugin.configs.recommended = {
  plugins: {
    galaxy: plugin,
  },
  rules: getRecommendedRules(baseRules),
}

plugin.configs['recommended-vue'] = {
  plugins: {
    galaxy: plugin,
  },
  rules: getRecommendedRules(vueRules),
}

plugin.configs.all = {
  plugins: {
    galaxy: plugin,
  },
  rules: {
    ...getAllRules(baseRules),
    ...getAllRules(tsRules),
    ...getAllRules(vueRules),
  },
}

module.exports = plugin
