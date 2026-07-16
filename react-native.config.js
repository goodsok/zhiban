/**
 * Exclude AsyncStorage from autolinking to prevent duplicate registration.
 * It is manually registered in MainApplication.kt instead.
 */
module.exports = {
  dependencies: {
    '@react-native-async-storage/async-storage': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
