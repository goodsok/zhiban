export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '朋友圈分析' })
  : {
      navigationStyle: 'custom',
      navigationBarTitleText: '朋友圈分析' }
