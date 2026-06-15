export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationStyle: 'custom', navigationBarTitleText: '互动详情' })
  : { navigationStyle: 'custom', navigationBarTitleText: '互动详情' }
