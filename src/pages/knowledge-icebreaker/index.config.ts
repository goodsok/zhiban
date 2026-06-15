export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationStyle: 'custom',
      navigationBarTitleText: '破冰话题',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
    })
  : {
      navigationBarTitleText: '破冰话题',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
    }
