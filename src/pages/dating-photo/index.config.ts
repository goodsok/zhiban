export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '照片评分',
    })
  : { navigationBarTitleText: '照片评分' }
