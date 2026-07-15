# React Native (App) 适配指南

知拌项目已支持 Taro React Native 编译，可将小程序代码编译为原生 App。

## 快速开始

### 1. 编译 RN Bundle

```bash
pnpm build:rn
```

生成产物: `dist/index.bundle`（约 4MB）

### 2. 启动 Metro 开发服务器

```bash
npx taro build --type rn -- --watch
```

Metro 服务器默认运行在 8081 端口。

### 3. 运行 App

#### 方式 A: 使用 Expo（推荐）

```bash
# 安装 Expo CLI（首次）
pnpm add -g expo-cli

# 启动 Expo
npx expo start --dev-client
```

#### 方式 B: 使用 React Native CLI

```bash
# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

## 文件结构

```
├── app.json                    # Expo 配置
├── App.js                      # Expo/RN 入口文件
├── metro.config.js             # Metro bundler 配置（含 @ 别名解析）
├── src/
│   ├── app.rn.tsx              # RN 端 App 入口（跳过 weapp-tailwindcss）
│   ├── app.rn.css              # RN 端全局样式（空，仅占位）
│   ├── components/
│   │   ├── portrait-radar.rn.tsx  # Canvas 雷达图的 RN 替代实现
│   │   └── ui/
│   │       ├── portal.rn.tsx     # Portal RN 版（移除 react-dom 依赖）
│   │       └── switch.rn.tsx     # Switch RN 版（Animated 动画）
```

## RN 适配规则

### `.rn.tsx` 文件约定

Taro RN 编译器会优先加载 `.rn.tsx` 文件，找不到时回退到 `.tsx`。
对 RN 不兼容的组件，创建同名 `.rn.tsx` 文件即可。

### 已知适配项

| 组件 | 问题 | 解决方案 |
|------|------|---------|
| Portal | 引入 `react-dom` | `portal.rn.tsx` 使用 View 替代 |
| Switch | CSS transition 不支持 | `switch.rn.tsx` 使用 Animated API |
| Canvas | RN 无 Canvas 组件 | `portrait-radar.rn.tsx` 使用 View/Text 替代 |
| 全局 CSS | `weapp-tailwindcss` 不兼容 | `app.rn.tsx` 跳过 CSS 导入 |
| stylelint | v16 移除 `declarationValueIndex` | 降级至 stylelint@15.11.0 |

### 需要后续适配的组件

以下组件使用了 DOM API（`document`/`window`），在 RN 端可能需要 `.rn.tsx` 版本：

- `context-menu.tsx` — 长按菜单
- `dropdown-menu.tsx` — 下拉菜单
- `popover.tsx` — 浮层
- `tooltip.tsx` — 工具提示
- `slider.tsx` — 滑块
- `resizable.tsx` — 可拖拽面板
- `menubar.tsx` — 菜单栏
- `navigation-menu.tsx` — 导航菜单

这些组件在当前 TabBar 三个页面（对象、发现、我的）中未被使用，后续按需适配。

## 打包发布

### Android

```bash
# 生成 Release Bundle
npx taro build --type rn -- --reset-cache

# 使用 React Native CLI 打包 APK
cd android && ./gradlew assembleRelease
```

### iOS

```bash
# 生成 Release Bundle
npx taro build --type rn -- --reset-cache

# 使用 Xcode 打包
cd ios && pod install
open *.xcworkspace
```

## 注意事项

1. **后端接口完全复用** — NestJS 服务无需修改，RN 端通过 `Network.request` 调用
2. **zustand 状态管理** — 直接复用，无平台依赖
3. **TabBar 导航** — Taro RN 自动映射 `switchTab`/`navigateTo` 到 react-navigation
4. **lucide-react-taro 图标** — 直接复用，RN 端通过 SVG → Image 渲染
5. **Tailwind CSS** — Taro RN 样式转换器自动处理，部分高级特性（动画、伪类）不支持
