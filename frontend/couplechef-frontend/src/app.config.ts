export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/storage/index',
    'pages/recipe/index',
    'pages/settings/index',
  ],
  window: {
    navigationBarBackgroundColor: '#fff0f5',
    navigationBarTextStyle: 'black',
    navigationBarTitleText: 'CoupleChef',
  },
  tabBar: {
    color: '#999',
    selectedColor: '#ff7da6',
    backgroundColor: '#ffe5ec',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '菜单',
        iconPath: 'assets/icons/food.png',
        selectedIconPath: 'assets/icons/food-active.png',
      },
      {
        pagePath: 'pages/storage/index',
        text: '冰箱',
        iconPath: 'assets/icons/fridge.png',
        selectedIconPath: 'assets/icons/fridge-active.png',
      },
      {
        pagePath: 'pages/recipe/index',
        text: '菜谱',
        iconPath: 'assets/icons/recipe.png',
        selectedIconPath: 'assets/icons/recipe-active.png',
      },
      {
        pagePath: 'pages/settings/index',
        text: '设置',
        iconPath: 'assets/icons/settings.png',
        selectedIconPath: 'assets/icons/settings-active.png',
      },
    ],
  },
})
