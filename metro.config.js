const path = require('path')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const { getMetroConfig } = require('@tarojs/rn-supporter')

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {}

module.exports = (async function () {
  const defaultConfig = getDefaultConfig(__dirname)
  const taroConfig = await getMetroConfig()

  // Wrap resolveRequest to add alias resolution as fallback
  const taroResolveRequest = taroConfig.resolver?.resolveRequest
  const customResolver = {
    resolveRequest(context, moduleName, platform) {
      // Try Taro's resolver first
      if (taroResolveRequest) {
        try {
          const result = taroResolveRequest(context, moduleName, platform)
          if (result) return result
        } catch (e) {
          // Fall through to alias resolution
        }
      }
      // Manual alias resolution for @/ prefix
      if (moduleName.startsWith('@/')) {
        const resolvedPath = path.resolve(__dirname, 'src', moduleName.slice(2))
        return context.resolveRequest(context, resolvedPath, platform)
      }
      // Default resolution
      return context.resolveRequest(context, moduleName, platform)
    },
  }

  const mergedConfig = mergeConfig(defaultConfig, taroConfig, {
    resolver: customResolver,
  })

  return mergedConfig
})()
