export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '快速问答' })
  : { navigationBarTitleText: '快速问答' }
