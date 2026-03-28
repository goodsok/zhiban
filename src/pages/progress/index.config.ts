export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '关系进度' })
  : { navigationBarTitleText: '关系进度' }
