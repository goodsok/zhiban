export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '发圈助手' })
  : {
      navigationStyle: 'custom',
      navigationBarTitleText: '发圈助手' }
