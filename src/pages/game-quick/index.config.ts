export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '快速问答', navigationStyle: 'custom' })
  : { navigationBarTitleText: '快速问答', navigationStyle: 'custom' }
