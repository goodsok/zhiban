export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '开场白生成',
      navigationStyle: 'custom',
    })
  : { navigationBarTitleText: '开场白生成', navigationStyle: 'custom' }
