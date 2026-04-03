export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '资料优化',
    })
  : { navigationBarTitleText: '资料优化' }
