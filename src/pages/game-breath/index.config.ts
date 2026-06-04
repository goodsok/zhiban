export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '呼吸同步' })
  : { navigationBarTitleText: '呼吸同步' }
