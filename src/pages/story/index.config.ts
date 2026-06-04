export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '故事生成器' })
  : {
      navigationStyle: 'custom',
      navigationBarTitleText: '故事生成器' }
