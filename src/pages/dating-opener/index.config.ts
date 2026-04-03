export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '开场白生成',
    })
  : { navigationBarTitleText: '开场白生成' }
