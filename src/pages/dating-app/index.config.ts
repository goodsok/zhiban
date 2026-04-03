export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '交友软件助手',
    })
  : { navigationBarTitleText: '交友软件助手' }
