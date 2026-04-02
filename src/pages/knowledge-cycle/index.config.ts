export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '周期科学',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
    })
  : {
      navigationBarTitleText: '周期科学',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
    }
