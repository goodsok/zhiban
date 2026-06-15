export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationStyle: 'custom', 
      navigationBarTitleText: '约会记录',
    })
  : { 
      navigationBarTitleText: '约会记录',
    }
