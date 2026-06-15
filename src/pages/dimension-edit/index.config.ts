export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationStyle: 'custom',
      navigationBarTitleText: '编辑维度'
    })
  : {
      navigationBarTitleText: '编辑维度' }
