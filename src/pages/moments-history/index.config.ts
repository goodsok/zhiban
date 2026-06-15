export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationStyle: 'custom', navigationBarTitleText: '发布记录' })
  : {
      navigationBarTitleText: '发布记录' }
