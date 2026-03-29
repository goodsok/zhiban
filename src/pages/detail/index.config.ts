export default typeof definePageConfig === 'function'
  ? definePageConfig({ 
      navigationBarTitleText: '详情',
      navigationStyle: 'custom'
    })
  : { 
      navigationBarTitleText: '详情',
      navigationStyle: 'custom'
    }
