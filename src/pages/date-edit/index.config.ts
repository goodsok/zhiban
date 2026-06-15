export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationStyle: 'custom', 
      navigationBarTitleText: '编辑约会',
    })
  : { 
      navigationBarTitleText: '编辑约会',
    }
