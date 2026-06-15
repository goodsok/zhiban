export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '真心话大冒险', navigationStyle: 'custom' })
  : { navigationBarTitleText: '真心话大冒险', navigationStyle: 'custom' }
