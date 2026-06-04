export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationStyle: 'custom',
      navigationBarTitleText: '周期科学',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
    })
  : {
      navigationStyle: 'custom',
      navigationBarTitleText: '周期科学',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
    }
