export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '聊天复盘', navigationStyle: 'custom' })
  : { navigationBarTitleText: '聊天复盘', navigationStyle: 'custom' }
