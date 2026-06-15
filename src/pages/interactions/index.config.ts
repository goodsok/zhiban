export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationStyle: 'custom',
      navigationBarTitleText: '互动记录',
    })
  : {
      navigationBarTitleText: '互动记录' }
