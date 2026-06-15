export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '周期追踪', navigationStyle: 'custom' })
  : { navigationBarTitleText: '周期追踪', navigationStyle: 'custom' }
