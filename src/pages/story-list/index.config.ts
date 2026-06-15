export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationStyle: 'custom', navigationBarTitleText: '故事列表' })
  : {
      navigationStyle: 'custom',
      navigationBarTitleText: '故事列表' }
