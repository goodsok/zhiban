export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '互动详情' })
  : { navigationBarTitleText: '互动详情' }
