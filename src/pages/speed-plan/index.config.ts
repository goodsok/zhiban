export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '速推方案' })
  : { navigationBarTitleText: '速推方案' }
