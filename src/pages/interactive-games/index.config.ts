export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '互动游戏' })
  : { navigationBarTitleText: '互动游戏' }
