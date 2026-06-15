export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '手心温度', navigationStyle: 'custom' })
  : { navigationBarTitleText: '手心温度', navigationStyle: 'custom' }
