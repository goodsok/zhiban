export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '聊天复盘' })
  : { navigationBarTitleText: '聊天复盘' }
