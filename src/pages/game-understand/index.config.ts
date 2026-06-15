export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '深入了解问答', navigationStyle: 'custom' })
  : { navigationBarTitleText: '深入了解问答', navigationStyle: 'custom' }
