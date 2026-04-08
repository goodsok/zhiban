export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '情景模拟' })
  : { navigationBarTitleText: '情景模拟' }
