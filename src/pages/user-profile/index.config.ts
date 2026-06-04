export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '我的档案' })
  : {
      navigationStyle: 'custom',
      navigationBarTitleText: '我的档案' }
