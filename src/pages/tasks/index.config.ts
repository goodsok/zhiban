export default typeof definePageConfig === 'function'
  ? definePageConfig({ 
      navigationBarTitleText: '互动任务',
      navigationStyle: 'custom'
    })
  : { 
      navigationBarTitleText: '互动任务',
      navigationStyle: 'custom'
    }
