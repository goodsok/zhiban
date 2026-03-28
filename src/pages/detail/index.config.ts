export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '详情' })
  : { navigationBarTitleText: '详情' }
