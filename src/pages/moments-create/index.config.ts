export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationStyle: 'custom', navigationBarTitleText: '发圈助手' })
  : {
      navigationBarTitleText: '发圈助手' }
