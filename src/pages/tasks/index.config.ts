export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationStyle: 'custom', 
      navigationBarTitleText: '互动任务',
    })
  : { 
      navigationBarTitleText: '互动任务',
    }
