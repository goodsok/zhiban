export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationStyle: 'custom', navigationBarTitleText: '故事生成器' })
  : {
      navigationBarTitleText: '故事生成器' }
