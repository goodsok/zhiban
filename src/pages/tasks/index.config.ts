export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '互动任务' })
  : { navigationBarTitleText: '互动任务' }
