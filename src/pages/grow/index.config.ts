export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '共同成长', navigationStyle: 'custom' })
  : { navigationBarTitleText: '共同成长', navigationStyle: 'custom' }
