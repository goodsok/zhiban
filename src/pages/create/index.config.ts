export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '建立档案' })
  : { navigationBarTitleText: '建立档案' }
