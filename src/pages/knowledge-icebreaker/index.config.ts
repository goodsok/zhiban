export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '破冰话题',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
    })
  : {
      navigationBarTitleText: '破冰话题',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
    }
