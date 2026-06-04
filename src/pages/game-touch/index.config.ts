export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '手心温度' })
  : { navigationBarTitleText: '手心温度' }
