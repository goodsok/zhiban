export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationStyle: 'custom',
      navigationBarTitleText: '互动记录',
    })
  : {
      navigationStyle: 'custom',
      navigationBarTitleText: '互动记录' }
