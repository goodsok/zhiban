export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '默契测试' })
  : { navigationBarTitleText: '默契测试' }
