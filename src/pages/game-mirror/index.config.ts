export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '双人镜像' })
  : { navigationBarTitleText: '双人镜像' }
