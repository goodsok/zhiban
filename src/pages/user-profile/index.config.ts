export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '我的档案' })
  : { navigationBarTitleText: '我的档案' }
