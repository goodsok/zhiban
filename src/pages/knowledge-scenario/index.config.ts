export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '场景演练', navigationStyle: 'custom' })
  : { navigationBarTitleText: '场景演练', navigationStyle: 'custom' }
