export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '人物画像' })
  : { navigationBarTitleText: '人物画像' }
