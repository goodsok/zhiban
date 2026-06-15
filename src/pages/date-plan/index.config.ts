export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationStyle: 'custom', navigationBarTitleText: '约会计划' })
  : { navigationStyle: 'custom', navigationBarTitleText: '约会计划' }
