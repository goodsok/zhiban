export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '故事生成器' })
  : { navigationBarTitleText: '故事生成器' }
