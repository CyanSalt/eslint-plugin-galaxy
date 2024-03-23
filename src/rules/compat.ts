import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import browserslist from 'browserslist'
import * as lite from 'caniuse-lite'
import { createRule } from '../utils'

interface FeatureData {
  selector: string,
}

const SUPPORTED_FEATURES: Record<string, FeatureData | undefined> = {
  'async-clipboard': {
    selector: 'MemberExpression[object.name="navigator"][property.name="clipboard"]',
  },
  'js-regexp-lookbehind': {
    selector: 'Literal[regex.pattern=/\\(\\?</]',
  },
}

const BROWSER_NAMES: Record<string, string | undefined> = {
  ie: 'IE',
  edge: 'Edge',
  firefox: 'Firefox',
  chrome: 'Chrome',
  safari: 'Safari',
  opera: 'Opera',
  ios_saf: 'iOS Safari',
  op_mini: 'Opera Mini',
  android: 'Android (Webview)',
  bb: 'Blackberry Browser',
  op_mob: 'Opera Mobile',
  and_chr: 'Android Chrome',
  and_ff: 'Android Firefox',
  ie_mob: 'IE Mobile',
  and_uc: 'Android UC Browser',
  samsung: 'Samsung Browser',
  and_qq: 'Android QQ Browser',
  baidu: 'Baidu Browser',
  kaios: 'KaiOS Browser',
}

interface BrowserData {
  name: string,
  version: number | [number, number] | string,
}

function withCache<K, T>(cache: Map<K, T>, key: K, getter: () => T) {
  if (!key) {
    return getter()
  }
  if (cache.has(key)) {
    return cache.get(key)!
  } else {
    const result = getter()
    cache.set(key, result)
    return result
  }
}

function isCompatible(
  targetVersion: BrowserData['version'],
  currentVersion: BrowserData['version'],
  ignoreCap = false,
) {
  if (typeof targetVersion === 'string') return false
  if (typeof currentVersion === 'string') return true
  if (Array.isArray(currentVersion)) {
    return isCompatible(targetVersion, currentVersion[0])
  }
  if (Array.isArray(targetVersion)) {
    return currentVersion >= targetVersion[0] && (ignoreCap || currentVersion <= targetVersion[1])
  } else {
    return currentVersion >= targetVersion
  }
}

function getBrowsersWithoutCache(...args: Parameters<typeof browserslist>) {
  const results = browserslist(...args)
  const browsers = results.map<BrowserData>(result => {
    const [name, version] = result.split(' ')
    let versionOrRange: BrowserData['version']
    if (version.includes('-')) {
      versionOrRange = version.split('-').map(side => parseFloat(side)) as [number, number]
    } else {
      const parsed = parseFloat(version)
      versionOrRange = isNaN(parsed) ? version : parsed
    }
    return {
      name,
      version: versionOrRange,
    }
  })
  const latest = browsers.reduce((map, data) => {
    if (map.has(data.name)) {
      const existing = map.get(data.name)!
      if (!isCompatible(existing.version, data.version, true)) {
        map.set(data.name, data)
      }
    } else {
      map.set(data.name, data)
    }
    return map
  }, new Map<string, BrowserData>())
  return Array.from(latest.values())
}

const browsersCache = new Map<string | string[], BrowserData[]>()

function getBrowsers(...args: Parameters<typeof browserslist>) {
  return withCache(
    browsersCache,
    args[0] ?? args[1]?.path,
    () => getBrowsersWithoutCache(...args),
  )
}

function getReadableBrowsers(browsers: BrowserData[]) {
  return browsers.map((data, index, arr) => {
    const sep = index ? (index < arr.length - 1 ? ', ' : ' or ') : ''
    const name = BROWSER_NAMES[data.name] ?? data.name
    const version = Array.isArray(data.version)
      ? data.version.join('-')
      : (typeof data.version === 'string' ? data.version : '>=' + data.version)
    return sep + name + ' ' + version
  }).join('')
}

function getIncompatibleBrowsers(targetBrowsers: BrowserData[], supportedBrowsers: BrowserData[]) {
  const coverage = supportedBrowsers
    .filter(data => targetBrowsers.some(item => item.name === data.name))
  if (!coverage.length) return supportedBrowsers
  return coverage.filter(data => {
    const targetBrowser = targetBrowsers.find(item => item.name === data.name)!
    return !isCompatible(data.version, targetBrowser.version)
  })
}

interface CaniuseLiteFeature {
  title: string,
}

const liteCache = new Map<string, CaniuseLiteFeature>()

function getFeatureTitle(feature: string) {
  const compressed = lite.features[feature]
  if (!compressed) return feature
  const data = withCache(
    liteCache,
    feature,
    (): CaniuseLiteFeature => lite.feature(compressed),
  )
  return data.title
}

function mergeVisitor(target: TSESLint.RuleListener, source: TSESLint.RuleListener) {
  for (const [selector, listener] of Object.entries(source)) {
    if (!listener) continue
    const originalListener = target[selector]
    if (originalListener) {
      target[selector] = (node) => {
        originalListener(node)
        listener(node)
      }
    } else {
      target[selector] = listener
    }
  }
  return target
}

const MESSAGE_ID_DEFAULT = 'compat'

export default createRule({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Avoid using incompatible features',
    },
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          browserslist: {
            anyOf: [
              {
                type: 'string',
              },
              {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            ],
          },
          ignores: {
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
      [MESSAGE_ID_DEFAULT]: '{{ feature }} is only compatible with {{ env }}',
    },
  },
  defaultOptions: [
    {
      ignores: [],
    } as {
      browserslist?: string | string[],
      ignores?: string[],
    },
  ],
  create(context) {
    const browserslistConfig = context.options[0]?.browserslist
    const ignores = context.options[0]?.ignores ?? []

    const includedFeatures = Object.keys(SUPPORTED_FEATURES)
      .filter(feature => !ignores.includes(feature))

    let visitor: TSESLint.RuleListener = {}

    const targetBrowsers = browserslistConfig
      ? getBrowsers(browserslistConfig)
      : getBrowsers(undefined, { path: context.cwd, env: 'defaults', throwOnMissing: true })
    if (!targetBrowsers.length) return visitor

    function reportIncompatibleUsage(node: TSESTree.Node, feature: string, browsers: BrowserData[]) {
      context.report({
        node,
        messageId: MESSAGE_ID_DEFAULT,
        data: {
          feature: getFeatureTitle(feature),
          env: getReadableBrowsers(browsers),
        },
      })
    }

    for (const feature of includedFeatures) {
      const supportedBrowsers = getBrowsers(`supports ${feature}`)
      const incompatibleBrowsers = getIncompatibleBrowsers(targetBrowsers, supportedBrowsers)
      if (incompatibleBrowsers.length) {
        const data = SUPPORTED_FEATURES[feature]!
        visitor = mergeVisitor(visitor, {
          [data.selector]: node => {
            reportIncompatibleUsage(node, feature, incompatibleBrowsers)
          },
        })
      }
    }

    return visitor
  },
})
