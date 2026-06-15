export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '情景模拟', navigationStyle: 'custom' })
  : { navigationBarTitleText: '情景模拟', navigationStyle: 'custom' }
