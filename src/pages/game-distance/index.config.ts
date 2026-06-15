export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '距离挑战', navigationStyle: 'custom' })
  : { navigationBarTitleText: '距离挑战', navigationStyle: 'custom' }
