export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '周期知识',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
    })
  : {
      navigationBarTitleText: '周期知识',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
    }
