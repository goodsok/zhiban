export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '观察力挑战', navigationStyle: 'custom' })
  : { navigationBarTitleText: '观察力挑战', navigationStyle: 'custom' }
