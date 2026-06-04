export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '情话生成器' })
  : { navigationBarTitleText: '情话生成器' }
