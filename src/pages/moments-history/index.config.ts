export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '发布记录' })
  : { navigationBarTitleText: '发布记录' }
