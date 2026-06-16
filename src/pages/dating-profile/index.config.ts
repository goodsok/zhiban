export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '资料优化',
      navigationStyle: 'custom',
    })
  : { navigationBarTitleText: '资料优化', navigationStyle: 'custom' }
