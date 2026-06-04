export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationStyle: 'custom',
      navigationBarTitleText: '记录互动',
    })
  : {
      navigationStyle: 'custom',
      navigationBarTitleText: '记录互动' }
