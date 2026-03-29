export default typeof definePageConfig === 'function'
  ? definePageConfig({ 
      navigationBarTitleText: '约会记录',
      navigationStyle: 'custom'
    })
  : { 
      navigationBarTitleText: '约会记录',
      navigationStyle: 'custom'
    }
