export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '周期追踪' })
  : { navigationBarTitleText: '周期追踪' }
