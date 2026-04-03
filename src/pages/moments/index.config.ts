export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '朋友圈助手' })
  : { navigationBarTitleText: '朋友圈助手' }
