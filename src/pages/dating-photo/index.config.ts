export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '照片评分', navigationStyle: 'custom' })
  : { navigationBarTitleText: '照片评分', navigationStyle: 'custom' }
