export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationStyle: 'custom', 
      navigationBarTitleText: '详情',
    })
  : { 
      navigationBarTitleText: '详情',
    }
