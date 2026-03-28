export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/tasks/index',
    'pages/quiz/index',
    'pages/progress/index',
    'pages/profile/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '心动约会',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#FF6B9D',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '心动',
        iconPath: './assets/tabbar/heart.png',
        selectedIconPath: './assets/tabbar/heart-active.png',
      },
      {
        pagePath: 'pages/tasks/index',
        text: '任务',
        iconPath: './assets/tabbar/sparkles.png',
        selectedIconPath: './assets/tabbar/sparkles-active.png',
      },
      {
        pagePath: 'pages/quiz/index',
        text: '默契',
        iconPath: './assets/tabbar/brain.png',
        selectedIconPath: './assets/tabbar/brain-active.png',
      },
      {
        pagePath: 'pages/progress/index',
        text: '进度',
        iconPath: './assets/tabbar/trending-up.png',
        selectedIconPath: './assets/tabbar/trending-up-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/tabbar/user.png',
        selectedIconPath: './assets/tabbar/user-active.png',
      },
    ],
  },
})
