export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '编辑维度'
    })
  : { navigationBarTitleText: '编辑维度' }
