export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '记录互动',
    })
  : { navigationBarTitleText: '记录互动' }
