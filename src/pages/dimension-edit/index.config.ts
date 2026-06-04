export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationStyle: 'custom',
      navigationBarTitleText: '编辑维度'
    })
  : {
      navigationStyle: 'custom',
      navigationBarTitleText: '编辑维度' }
