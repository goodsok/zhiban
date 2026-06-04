export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '发布记录' })
  : {
      navigationStyle: 'custom',
      navigationBarTitleText: '发布记录' }
