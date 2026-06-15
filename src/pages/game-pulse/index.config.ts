export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '心跳同步', navigationStyle: 'custom' })
  : { navigationBarTitleText: '心跳同步', navigationStyle: 'custom' }
