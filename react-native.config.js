const path = require('path')

module.exports = {
  project: {
    android: {
      sourceDir: path.resolve(__dirname, 'android'),
    },
  },
  dependencies: {
    '@react-native-async-storage/async-storage': {
      root: path.resolve(__dirname, 'node_modules/@react-native-async-storage/async-storage'),
    },
    'react-native-gesture-handler': {
      root: path.resolve(__dirname, 'node_modules/react-native-gesture-handler'),
    },
    'react-native-safe-area-context': {
      root: path.resolve(__dirname, 'node_modules/react-native-safe-area-context'),
    },
    'react-native-screens': {
      root: path.resolve(__dirname, 'node_modules/react-native-screens'),
    },
    'react-native-svg': {
      root: path.resolve(__dirname, 'node_modules/react-native-svg'),
    },
    '@react-native-masked-view/masked-view': {
      root: path.resolve(__dirname, 'node_modules/@react-native-masked-view/masked-view'),
    },
  },
}
