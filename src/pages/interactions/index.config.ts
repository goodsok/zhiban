export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '互动记录',
    })
  : { navigationBarTitleText: '互动记录' }
