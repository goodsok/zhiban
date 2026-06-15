export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '关系进度', navigationStyle: 'custom' })
  : { navigationBarTitleText: '关系进度', navigationStyle: 'custom' }
