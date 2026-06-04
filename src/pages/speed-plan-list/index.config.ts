export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '速推方案',
      navigationStyle: 'custom',
    })
  : {
      navigationBarTitleText: '速推方案',
      navigationStyle: 'custom',
    }
