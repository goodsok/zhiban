export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationStyle: 'custom', 
      navigationBarTitleText: '建立档案',
    })
  : { 
      navigationBarTitleText: '建立档案',
    }
