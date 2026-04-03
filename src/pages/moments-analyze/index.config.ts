export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '朋友圈分析' })
  : { navigationBarTitleText: '朋友圈分析' }
