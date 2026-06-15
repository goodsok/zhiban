export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '朋友圈助手', navigationStyle: 'custom' })
  : { navigationBarTitleText: '朋友圈助手', navigationStyle: 'custom' }
