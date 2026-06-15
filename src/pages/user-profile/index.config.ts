export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationStyle: 'custom', navigationBarTitleText: '我的档案' })
  : {
      navigationBarTitleText: '我的档案' }
