export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '盲触感知' })
  : { navigationBarTitleText: '盲触感知' }
