export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '盲触感知', navigationStyle: 'custom' })
  : { navigationBarTitleText: '盲触感知', navigationStyle: 'custom' }
