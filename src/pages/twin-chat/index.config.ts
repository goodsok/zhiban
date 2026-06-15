export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationStyle: 'custom', navigationBarTitleText: '数字孪生体' })
  : { navigationStyle: 'custom', navigationBarTitleText: '数字孪生体' }
