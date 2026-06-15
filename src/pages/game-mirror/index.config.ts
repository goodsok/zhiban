export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '双人镜像', navigationStyle: 'custom' })
  : { navigationBarTitleText: '双人镜像', navigationStyle: 'custom' }
