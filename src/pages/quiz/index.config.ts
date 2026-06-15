export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '默契测试', navigationStyle: 'custom' })
  : { navigationBarTitleText: '默契测试', navigationStyle: 'custom' }
