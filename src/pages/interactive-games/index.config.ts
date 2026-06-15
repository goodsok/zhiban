export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '互动游戏', navigationStyle: 'custom' })
  : { navigationBarTitleText: '互动游戏', navigationStyle: 'custom' }
