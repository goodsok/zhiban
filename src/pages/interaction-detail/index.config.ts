export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '互动详情', navigationStyle: 'custom' })
  : { navigationBarTitleText: '互动详情', navigationStyle: 'custom' }
