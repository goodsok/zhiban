export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '心跳同步' })
  : { navigationBarTitleText: '心跳同步' }
