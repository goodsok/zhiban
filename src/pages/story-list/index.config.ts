export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '故事列表' })
  : { navigationBarTitleText: '故事列表' }
