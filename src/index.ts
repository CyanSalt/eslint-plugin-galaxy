import type { TSESLint } from '@typescript-eslint/utils'
import pkg from '../package.json' with { type: 'json' }
import compat from './rules/compat'
import esmBundler from './rules/esm-bundler'
import importExtensions from './rules/import-extensions'
import maxNestedDestructuring from './rules/max-nested-destructuring'
import multiBranchCurly from './rules/multi-branch-curly'
import noForIn from './rules/no-for-in'
import noMisusedGlobals from './rules/no-misused-globals'
import noPrototypeAsValue from './rules/no-prototype-as-value'
import noRestrictedBarrelImports from './rules/no-restricted-barrel-imports'
import noRestrictedFloatingPromises from './rules/no-restricted-floating-promises'
import noUnnecessaryOptionalChain from './rules/no-unnecessary-optional-chain'
import noUnsafeNumber from './rules/no-unsafe-number'
import noUnsafeWindowOpen from './rules/no-unsafe-window-open'
import nonControlStatementCurly from './rules/non-control-statement-curly'
import validIndexofReturn from './rules/valid-indexof-return'
import noAsAny from './typescript/no-as-any'
import type { Rule } from './utils'
import { getRuleBasename, getRuleName } from './utils'
import conventionalVueKeysOrder from './vue/conventional-vue-keys-order'
import noAmbiguousVueDefaultProps from './vue/no-ambiguous-vue-default-props'
import noDuplicateVueStoreMappings from './vue/no-duplicate-vue-store-mappings'
import noDuplicateVueUses from './vue/no-duplicate-vue-uses'
import noDuplicateVuexProperties from './vue/no-duplicate-vuex-properties'
import noEmptyVueOptions from './vue/no-empty-vue-options'
import noInvalidVueInjectKeys from './vue/no-invalid-vue-inject-keys'
import noInvalidVuePropKeys from './vue/no-invalid-vue-prop-keys'
import noRestrictedVueUnhandledPromises from './vue/no-restricted-vue-unhandled-promises'
import noSharedVueProvide from './vue/no-shared-vue-provide'
import noUnknownVueOptions from './vue/no-unknown-vue-options'
import noUnusedVuexProperties from './vue/no-unused-vuex-properties'
import noVueSfcTextNode from './vue/no-vue-sfc-text-node'
import requireVueDefaultInject from './vue/require-vue-default-inject'
import validVueReactivityTransformProps from './vue/valid-vue-reactivity-transform-props'
import validVueVIfWithVSlot from './vue/valid-vue-v-if-with-v-slot'
import validVuexProperties from './vue/valid-vuex-properties'
import vueAttributeSpacing from './vue/vue-attribute-spacing'
import vueReactivityTransformUsesVars from './vue/vue-reactivity-transform-uses-vars'
import vueRefStyle from './vue/vue-ref-style'

function getRecommendedRules(rules: Rule[]) {
  return Object.fromEntries(
    rules
      .filter(rule => rule.meta.docs?.recommended)
      .map(rule => [getRuleName(rule.name), 'error' as const]),
  )
}

function getAllRules(rules: Rule[]) {
  return Object.fromEntries(
    rules
      .filter(rule => !rule.meta.deprecated)
      .map(rule => [getRuleName(rule.name), 'error' as const]),
  )
}

function getScopedRules(rules: Rule[]) {
  return Object.fromEntries(
    rules
      .filter(rule => !rule.meta.deprecated)
      .map(rule => [getRuleBasename(rule.name), rule]),
  )
}

const baseRules = [
  compat,
  esmBundler,
  importExtensions,
  maxNestedDestructuring,
  multiBranchCurly,
  noForIn,
  noMisusedGlobals,
  noPrototypeAsValue,
  noRestrictedBarrelImports,
  noRestrictedFloatingPromises,
  noUnnecessaryOptionalChain,
  noUnsafeNumber,
  noUnsafeWindowOpen,
  nonControlStatementCurly,
  validIndexofReturn,
]
const tsRules = [
  noAsAny,
]
const vueRules = [
  conventionalVueKeysOrder,
  noAmbiguousVueDefaultProps,
  noDuplicateVueStoreMappings,
  noDuplicateVueUses,
  noDuplicateVuexProperties,
  noEmptyVueOptions,
  noInvalidVueInjectKeys,
  noInvalidVuePropKeys,
  noRestrictedVueUnhandledPromises,
  noSharedVueProvide,
  noUnknownVueOptions,
  noUnusedVuexProperties,
  noVueSfcTextNode,
  requireVueDefaultInject,
  validVueReactivityTransformProps,
  validVueVIfWithVSlot,
  validVuexProperties,
  vueAttributeSpacing,
  vueReactivityTransformUsesVars,
  vueRefStyle,
]

const plugin: TSESLint.FlatConfig.Plugin & { configs: TSESLint.FlatConfig.SharedConfigs } = {
  meta: {
    name: pkg.name,
    version: pkg.version,
  },
  rules: getScopedRules([
    ...baseRules,
    ...tsRules,
    ...vueRules,
  ]),
  configs: {},
}

plugin.configs.recommended = {
  name: 'galaxy/recommended',
  plugins: {
    galaxy: plugin,
  },
  rules: getRecommendedRules(baseRules),
}

plugin.configs['recommended-vue'] = {
  name: 'galaxy/recommended-vue',
  plugins: {
    galaxy: plugin,
  },
  rules: getRecommendedRules(vueRules),
}

plugin.configs.all = {
  name: 'galaxy/all',
  plugins: {
    galaxy: plugin,
  },
  rules: {
    ...getAllRules(baseRules),
    ...getAllRules(tsRules),
    ...getAllRules(vueRules),
  },
}

export default plugin
