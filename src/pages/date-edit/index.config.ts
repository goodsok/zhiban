export default typeof definePageConfig === 'function'
  ? definePageConfig({ 
      navigationBarTitleText: '编辑约会',
      navigationStyle: 'custom'
    })
  : { 
      navigationBarTitleText: '编辑约会',
      navigationStyle: 'custom'
    }
