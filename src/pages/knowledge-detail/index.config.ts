export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationStyle: 'custom',
      navigationBarTitleText: '周期知识',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
    })
  : {
      navigationStyle: 'custom',
      navigationBarTitleText: '周期知识',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
    }
