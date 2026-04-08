export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '观察力挑战' })
  : { navigationBarTitleText: '观察力挑战' }
