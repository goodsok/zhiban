export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationStyle: 'custom', navigationBarTitleText: '人物画像' })
  : { navigationStyle: 'custom', navigationBarTitleText: '人物画像' }
