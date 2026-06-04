export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '约会计划' })
  : { navigationBarTitleText: '约会计划' }
