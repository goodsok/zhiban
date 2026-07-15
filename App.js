/**
 * React Native / Expo 入口文件
 *
 * 此文件为 Expo 的入口，加载 Taro RN 编译产物。
 * Taro 的 RN 入口会通过 AppRegistry 注册应用组件。
 *
 * 运行方式:
 * 1. 启动 Metro bundler: npx taro build --type rn -- --watch
 * 2. 启动 Expo: npx expo start --dev-client
 * 3. 或直接: npx react-native run-android / run-ios
 */

// @tarojs/rn-supporter 生成的 entry-file 会自动注册 AppRegistry
// Expo 只需引入 Taro 的入口即可
require('@tarojs/rn-supporter/entry-file.js')
