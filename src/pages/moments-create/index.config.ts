export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '发圈助手' })
  : { navigationBarTitleText: '发圈助手' }
