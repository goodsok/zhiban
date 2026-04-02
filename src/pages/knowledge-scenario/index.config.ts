export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '场景演练' })
  : { navigationBarTitleText: '场景演练' }
