export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '呼吸同步', navigationStyle: 'custom' })
  : { navigationBarTitleText: '呼吸同步', navigationStyle: 'custom' }
