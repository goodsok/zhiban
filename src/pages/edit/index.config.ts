export default typeof definePageConfig === 'function'
  ? definePageConfig({ 
      navigationBarTitleText: '编辑档案',
      navigationStyle: 'custom'
    })
  : { 
      navigationBarTitleText: '编辑档案',
      navigationStyle: 'custom'
    }
